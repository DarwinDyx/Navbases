import base64
import csv
import logging
import os
from datetime import date, timedelta
from io import BytesIO
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
import pdfkit
from django.conf import settings
from django.core.files.storage import default_storage
from django.db import models
from django.http import HttpResponse
from django.template.loader import render_to_string
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import *
from .serializers import *

logger = logging.getLogger(__name__)

# ----------------------------------------------------------------------
# FILTRE PERSONNALISÉ POUR LE TEMPLATE
# ----------------------------------------------------------------------

from django.template.defaulttags import register

@register.filter
def basename(value):
    """Retourne le nom de fichier sans le chemin"""
    if not value:
        return ""
    if isinstance(value, str):
        # Supprimer les paramètres de requête et le chemin
        filename = value.split('/')[-1].split('?')[0]
        # Si c'est une Data URL, retourner "image"
        if filename.startswith('data:'):
            return "image"
        return filename
    return str(value)

# ----------------------------------------------------------------------
# VUES D'ALERTE ET D'EXPORT (APIView et Base)
# ----------------------------------------------------------------------

class AlertesSummaryView(APIView):
    def get(self, request):
        today = date.today()
        soon = today + timedelta(days=30)
        
        # Documents expirés
        details_expires = []
        for a in Assurance.objects.filter(date_fin__lt=today).select_related('navire'):
            details_expires.append(self._doc_dict(a.navire, "Assurance", a.date_fin, "expired"))
        for v in Visite.objects.filter(expiration_permis__lt=today).select_related('navire'):
            details_expires.append(self._doc_dict(v.navire, f"Visite ({v.lieu_visite})", v.expiration_permis, "expired"))
        for d in Dossier.objects.filter(date_expiration__lt=today).select_related('navire'):
            details_expires.append(self._doc_dict(d.navire, f"Dossier ({d.type_dossier})", d.date_expiration, "expired"))

        # Documents bientôt expirés
        soon_assurances = Assurance.objects.filter(date_fin__gte=today, date_fin__lte=soon)
        soon_visites = Visite.objects.filter(expiration_permis__gte=today, expiration_permis__lte=soon)
        soon_dossiers = Dossier.objects.filter(date_expiration__gte=today, date_expiration__lte=soon)
        
        total_soon = soon_assurances.count() + soon_visites.count() + soon_dossiers.count()
        
        # Documents valides (expire après 'soon')
        total_valid = (
            Assurance.objects.filter(date_fin__gt=soon).count() +
            Visite.objects.filter(expiration_permis__gt=soon).count() +
            Dossier.objects.filter(date_expiration__gt=soon).count()
        )

        # Liste des documents presque expirés
        docs_presque_expires = []
        for a in soon_assurances.select_related('navire'):
            docs_presque_expires.append(self._doc_dict(a.navire, "Assurance", a.date_fin, "soon"))
        for v in soon_visites.select_related('navire'):
            docs_presque_expires.append(self._doc_dict(v.navire, "Visite", v.expiration_permis, "soon"))
        for d in soon_dossiers.select_related('navire'):
            docs_presque_expires.append(self._doc_dict(d.navire, f"Dossier ({d.type_dossier})", d.date_expiration, "soon"))

        # Navires récents
        navires_recents = list(Navire.objects.order_by("-id")[:5].values("id", "nom_navire", "num_immatricule"))
        navires_recents = [{"id": n["id"], "nom": n["nom_navire"], "immatriculation": n["num_immatricule"]} for n in navires_recents]

        return Response({
            "documentsExpires": len(details_expires),
            "documentsBientotExpires": total_soon,
            "total_alertes": len(details_expires) + total_soon,
            "total_valide": total_valid,
            "liste_expires": details_expires,
            "naviresRecents": navires_recents,
            "documentsPresqueExpires": docs_presque_expires
        })

    def _doc_dict(self, navire, doc_type, date_exp, alert_type):
        """Helper pour formater les données d'alerte."""
        if alert_type == "expired":
            return {
                "navire_id": navire.id,
                "navire_nom": navire.nom_navire,
                "document": doc_type,
                "date": date_exp.strftime("%Y-%m-%d"),
                "type_alerte": "expired"
            }
        else:
            return {
                "navire_id": navire.id,
                "navire": navire.nom_navire,
                "type": doc_type,
                "expire_le": date_exp.strftime("%Y-%m-%d")
            }


class ExportNaviresFiltresView(APIView):
    """
    Vue de support pour appliquer le filtrage et générer une réponse CSV.
    Utilisée par les actions du NavireViewSet.
    """
    def get(self, request):
        queryset = self._apply_filters(request)
        return self._generate_csv_response(queryset, "navires_filtres", request)

    def _apply_filters(self, request):
        """Applique les filtres GET à la queryset Navire."""
        types_navire = request.GET.getlist('types_navire[]') or request.GET.getlist('types_navire')
        proprietaires_ids = request.GET.getlist('proprietaires[]') or request.GET.getlist('proprietaires')
        activites_ids = request.GET.getlist('activites[]') or request.GET.getlist('activites')
        annee_min = request.GET.get('annee_min')
        annee_max = request.GET.get('annee_max')
        search_query = request.GET.get('search', '').strip()

        # Optimisation des requêtes
        queryset = Navire.objects.select_related('proprietaire').prefetch_related(
            'activites', 'assurances__assureur', 'moteurs', 'visites', 'dossiers', 'meta_donnees'
        ).all()

        if search_query:
            queryset = queryset.filter(
                models.Q(nom_navire__icontains=search_query) |
                models.Q(num_immatricule__icontains=search_query) |
                models.Q(proprietaire__nom_proprietaire__icontains=search_query) |
                models.Q(type_navire__icontains=search_query) |
                models.Q(lieu_de_construction__icontains=search_query) |
                models.Q(mmsi__icontains=search_query)
            )

        if types_navire:
            queryset = queryset.filter(type_navire__in=types_navire)
        if proprietaires_ids:
            queryset = queryset.filter(proprietaire_id__in=proprietaires_ids)
        if activites_ids:
            queryset = queryset.filter(activites__id__in=activites_ids).distinct()
        if annee_min:
            queryset = queryset.filter(annee_de_construction__gte=annee_min)
        if annee_max:
            queryset = queryset.filter(annee_de_construction__lte=annee_max)

        return queryset

    def _generate_csv_response(self, queryset, filename_prefix, request):
        """Génère la réponse HTTP contenant le fichier CSV."""
        try:
            response = HttpResponse(content_type='text/csv; charset=utf-8-sig')
            filename = f"{filename_prefix}_{timezone.now().strftime('%Y-%m-%d_%H-%M')}.csv"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            
            # Obtenir toutes les métadonnées uniques pour créer les colonnes
            all_meta_names = self._get_all_meta_names(queryset)
            
            writer = csv.writer(response, delimiter=';')
            
            # Créer les en-têtes avec colonnes de métadonnées
            headers = [
                "ID", "Nom Navire", "Immatriculation", "Type", "Année Construction",
                "Lieu Construction", "Nature Coque", "Passagers", "Équipage",
                "Propriétaire", "Type Propriétaire", "Contact Propriétaire", "Activités", 
                "Assurances", "Moteurs", "Visites", "Dossiers"
            ]
            
            # Ajouter les colonnes pour chaque nom de métadonnée
            headers.extend(all_meta_names)
            
            writer.writerow(headers)

            for navire in queryset:
                writer.writerow(self._format_navire_row(navire, all_meta_names, request))

            return response
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération du CSV: {str(e)}")
            import traceback
            traceback.print_exc()
            # Retourner une réponse d'erreur au lieu de faire planter
            return Response(
                {"error": f"Erreur lors de la génération du CSV: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _get_all_meta_names(self, queryset):
        """Récupère tous les noms de métadonnées uniques à travers tous les navires."""
        meta_names = set()
        for navire in queryset:
            for meta in navire.meta_donnees.all():
                meta_names.add(meta.nom_meta_donne)
        
        # Trier par ordre alphabétique pour une sortie cohérente
        return sorted(list(meta_names))

    def _format_navire_row(self, navire, all_meta_names, request):
        """Formate une ligne de données d'un navire pour le CSV avec métadonnées en colonnes."""
        try:
            proprietaire = navire.proprietaire
            
            # Formatage du contact avec apostrophe pour éviter les calculs Excel
            contact_proprietaire = proprietaire.contact if proprietaire else "N/A"
            if contact_proprietaire and contact_proprietaire != "N/A":
                # Ajoute une apostrophe au début pour traiter comme texte dans Excel
                contact_proprietaire = "'" + str(contact_proprietaire)
            
            # Récupérer les métadonnées du navire dans un dictionnaire pour un accès rapide
            meta_dict = {}
            for meta in navire.meta_donnees.all():
                meta_dict[meta.nom_meta_donne] = self._format_single_meta_for_csv(meta, request)
            
            # Créer la ligne de base
            row = [
                navire.id,
                navire.nom_navire or "N/A",
                navire.num_immatricule or "N/A",
                navire.type_navire or "N/A",
                navire.annee_de_construction or "N/A",
                navire.lieu_de_construction or "N/A",
                navire.nature_coque or "N/A",
                navire.nbr_passager or "N/A",
                navire.nbr_equipage or "N/A",
                proprietaire.nom_proprietaire if proprietaire else "N/A",
                self._get_proprietaire_type_label(proprietaire),
                contact_proprietaire,  # Contact formaté avec apostrophe
                ", ".join([a.nom_activite for a in navire.activites.all()]) or "Aucune",
                "; ".join([f"{a.assureur.nom_assureur} ({a.date_debut.strftime('%d/%m/%Y') if a.date_debut else 'N/A'}-{a.date_fin.strftime('%d/%m/%Y') if a.date_fin else 'N/A'})" 
                            for a in navire.assurances.all()]) or "Aucune",
                "; ".join([f"{m.nom_moteur} ({m.puissance or 'Puissance N/A'} CV)" for m in navire.moteurs.all()]) or "Aucun",
                "; ".join([f"{v.lieu_visite} ({v.date_visite.strftime('%d/%m/%Y') if v.date_visite else 'N/A'}, expire: {v.expiration_permis.strftime('%d/%m/%Y') if v.expiration_permis else 'N/A'})" 
                            for v in navire.visites.all()]) or "Aucune",
                "; ".join([f"{d.type_dossier} ({d.date_emission.strftime('%d/%m/%Y') if d.date_emission else 'N/A'})" for d in navire.dossiers.all()]) or "Aucun",
            ]
            
            # Ajouter les valeurs de métadonnées dans l'ordre des colonnes
            for meta_name in all_meta_names:
                row.append(meta_dict.get(meta_name, ""))
            
            return row
            
        except Exception as e:
            logger.error(f"Erreur lors du formatage du navire {navire.id}: {str(e)}")
            # Retourne une ligne avec des valeurs par défaut
            default_row = [f"Erreur: {str(e)}"] * (17 + len(all_meta_names))
            return default_row

    def _format_single_meta_for_csv(self, meta, request):
        """Formate une seule métadonnée pour le CSV."""
        try:
            if meta.type_meta_donne in ['FICHIER', 'IMAGE'] and meta.fichier_meta_donne:
                # Pour les fichiers/images, on affiche l'URL complète
                try:
                    url = request.build_absolute_uri(meta.fichier_meta_donne.url)
                    return url
                except (ValueError, AttributeError):
                    # Si le fichier n'a pas d'URL, on affiche le nom du fichier
                    file_name = os.path.basename(str(meta.fichier_meta_donne))
                    return f"Fichier: {file_name}"
            
            elif meta.type_meta_donne == 'BOOLEEN':
                # Pour les booléens, on formate de manière lisible
                valeur = meta.valeur_texte or ""
                if valeur.lower() in ['true', '1', 'yes', 'oui', 'vrai']:
                    return "Oui"
                elif valeur.lower() in ['false', '0', 'no', 'non', 'faux']:
                    return "Non"
                else:
                    return valeur
            
            elif meta.type_meta_donne == 'DATE' and meta.valeur_texte:
                # Pour les dates, on essaie de formater
                try:
                    from django.utils.dateparse import parse_date
                    date_obj = parse_date(meta.valeur_texte)
                    if date_obj:
                        return date_obj.strftime('%d/%m/%Y')
                    else:
                        return meta.valeur_texte
                except:
                    return meta.valeur_texte
            
            elif meta.type_meta_donne == 'HEURE' and meta.valeur_texte:
                # Pour les heures, on essaie de formater
                try:
                    from django.utils.dateparse import parse_time
                    time_obj = parse_time(meta.valeur_texte)
                    if time_obj:
                        return time_obj.strftime('%H:%M')
                    else:
                        return meta.valeur_texte
                except:
                    return meta.valeur_texte
            
            else:
                # Pour les autres types, on affiche la valeur texte
                valeur = meta.valeur_texte or ""
                # Tronquer les valeurs trop longues
                if len(valeur) > 100:
                    valeur = valeur[:97] + "..."
                return valeur
                
        except Exception as e:
            logger.error(f"Erreur lors du formatage de la métadonnée {meta.id}: {str(e)}")
            return f"Erreur: {str(e)}"

    def _get_proprietaire_type_label(self, proprietaire):
        """Convertit la clé du type de propriétaire en étiquette lisible."""
        if not proprietaire:
            return "N/A"
        type_mapping = {
            'particulier': 'Particulier', 'entreprise': 'Entreprise', 
            'gouvernement': 'Gouvernement', 'association': 'Association', 'autre': 'Autre'
        }
        return type_mapping.get(proprietaire.type_proprietaire, proprietaire.type_proprietaire or "Non spécifié")


class BasePDFView:
    """Classe de base pour la gestion des PDF avec logo (Utilise pdfkit/wkhtmltopdf)"""
    
    def _get_logo_base64(self):
        """Cherche et convertit le logo en base64"""
        logo_paths = [
            os.path.join(settings.MEDIA_ROOT, 'logo', 'cfimlogo.png'),
            os.path.join(settings.MEDIA_ROOT, 'cfimlogo.png'),
            os.path.join(settings.BASE_DIR, 'static', 'logo', 'cfimlogo.png'),
            os.path.join(settings.BASE_DIR, 'logo', 'cfimlogo.png'),
        ]
        
        for logo_path in logo_paths:
            if os.path.exists(logo_path):
                try:
                    with open(logo_path, "rb") as img_file:
                        return base64.b64encode(img_file.read()).decode()
                except Exception as e:
                    logger.warning(f"Erreur lecture logo {logo_path}: {e}")
                    continue
            
        logger.warning("Logo cfimlogo.png non trouvé dans les chemins standard.")
        return None
    
    def _generate_pdf_response(self, html_content, filename):
        """Génère une réponse PDF à partir de HTML en utilisant pdfkit"""
        try:
            # Chargement de la configuration depuis settings.py
            path_wkhtmltopdf = settings.PDFKIT_CONFIG.get('wkhtmltopdf')
            
            if not path_wkhtmltopdf:
                logger.error("Chemin wkhtmltopdf manquant dans settings.PDFKIT_CONFIG")
                return None

            config = pdfkit.configuration(wkhtmltopdf=path_wkhtmltopdf)
            
            options={
                'encoding': 'UTF-8',
                # Active l'accès aux fichiers locaux (nécessaire pour les images non Base64/URLs)
                'enable-local-file-access': True, 
                'quiet': '', 
                'no-stop-slow-scripts': '', 
                'page-size': 'A4',
                'margin-top': '1in',
                'margin-right': '0.75in',
                'margin-bottom': '1in',
                'margin-left': '0.75in',
            }

            # Génération du PDF avec la configuration
            try:
                pdf_data = pdfkit.from_string(
                    html_content, 
                    False, 
                    configuration=config,
                    options=options
                )
            except IOError as e:
                logger.error(f"IOError lors de la conversion PDF (wkhtmltopdf a planté ou n'est pas trouvé/accessible): {e}")
                logger.error(f"Configuration wkhtmltopdf utilisée: {path_wkhtmltopdf}")
                return None
            
            response = HttpResponse(pdf_data, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
            
        except Exception as e:
            logger.error(f"Erreur générale dans _generate_pdf_response: {e}")
            return None

# ----------------------------------------------------------------------
# VIEWSETS DRF
# ----------------------------------------------------------------------

class NavireViewSet(viewsets.ModelViewSet, BasePDFView):
    """ViewSet pour la gestion et l'exportation des Navires."""
    queryset = Navire.objects.all()
    serializer_class = NavireSerializer
    
    def _get_navire_image_base64(self, navire):
        if not hasattr(navire, 'photo_navire') or not navire.photo_navire or not navire.photo_navire.name:
            logger.info(f"Navire ID {navire.id} : Le champ photo_navire est vide ou non défini.")
            return None
        
        file_name = navire.photo_navire.name
        
        try:
            logger.info(f"Navire ID {navire.id} : Tentative d'ouverture du fichier : {file_name}")
            
            with default_storage.open(file_name, 'rb') as f:
                image_data = f.read()
                
                file_extension = os.path.splitext(file_name)[1].lower()
                if file_extension in ['.jpg', '.jpeg']:
                    mime_type = 'image/jpeg'
                elif file_extension == '.png':
                    mime_type = 'image/png'
                else:
                    mime_type = 'application/octet-stream' 
                    logger.warning(f"Navire ID {navire.id}: Extension d'image non gérée ({file_extension}).")

                base64_encoded = base64.b64encode(image_data).decode('utf-8')
                logger.info(f"Navire ID {navire.id} : Image encodée en Base64. Taille de la chaîne : {len(base64_encoded) / 1024:.2f} KB")
                
                # Retourne la Data URI complète
                return f"data:{mime_type};base64,{base64_encoded}"
        
        except FileNotFoundError:
            logger.error(f"Navire ID {navire.id} : FileNotFoundError. Fichier non trouvé sur le disque : {file_name}")
            return None
        except Exception as e:
            logger.error(f"Navire ID {navire.id} : Erreur lors de la conversion de l'image en Base64: {e}")
            return None

    @action(detail=False, methods=['get'])
    def nature_coque_choices(self, request):
        return Response([choice[0] for choice in Navire.NATURE_COQUE_CHOICES])

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """Exportation CSV de tous les navires."""
        try:
            # Créer une instance de ExportNaviresFiltresView
            export_view = ExportNaviresFiltresView()
            # Appeler la méthode avec le request
            return export_view._generate_csv_response(self.queryset, "navires_complets", request)
        except Exception as e:
            logger.error(f"Erreur export_csv: {str(e)}")
            return Response(
                {"error": f"Erreur lors de l'export CSV: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def export_csv_filtered(self, request):
        """Exportation CSV des navires filtrés via les paramètres GET."""
        try:
            # Créer une instance de ExportNaviresFiltresView
            export_view = ExportNaviresFiltresView()
            # Appliquer les filtres
            queryset = export_view._apply_filters(request)
            # Générer la réponse CSV
            return export_view._generate_csv_response(queryset, "navires_filtres", request)
        except Exception as e:
            logger.error(f"Erreur export_csv_filtered: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {"error": f"Erreur lors de l'export CSV filtré: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    # SUPPRIMÉ: L'export CSV d'un seul navire (export_one_csv)
    # @action(detail=True, methods=['get'])
    # def export_one_csv(self, request, pk=None):
    #     """Exportation CSV d'un navire spécifique."""
    #     ...

    @action(detail=True, methods=['get'])
    def export_one_pdf(self, request, pk=None):
        """Génère et retourne la fiche d'un navire en PDF."""
        try:
            navire = self.get_object()
            
            logo_base64 = self._get_logo_base64()
            navire_image_base64 = self._get_navire_image_base64(navire)

            # Récupérer le nom du fichier image du navire
            navire_image_name = None
            if navire.photo_navire and navire.photo_navire.name:
                navire_image_name = os.path.basename(navire.photo_navire.name)

            # --- Préparer les métadonnées avec tri par type ---
            meta_donnees_preparees = []
            now = timezone.now()
            in_30_days = now + timedelta(days=30)
            
            # Ordre de tri personnalisé pour les types de métadonnées
            type_order = {
                'TEXTE': 1,
                'NOMBRE': 2,
                'DATE': 3,
                'HEURE': 4,
                'BOOLEEN': 5,
                'URL': 6,
                'FICHIER': 7,
                'IMAGE': 8,
            }
            
            # Préparer et trier les métadonnées
            meta_list = []
            for meta in navire.meta_donnees.all():
                valeur_meta_donne = meta.valeur_meta_donne
                valeur_pour_template = valeur_meta_donne

                # Si c'est un fichier ou une image, nous extrayons l'URL absolue
                if meta.type_meta_donne in ['FICHIER', 'IMAGE'] and valeur_meta_donne:
                    try:
                        relative_url = valeur_meta_donne.url
                        valeur_pour_template = request.build_absolute_uri(relative_url)
                    except ValueError:
                        valeur_pour_template = None
                
                meta_data = {
                    'type_meta_donne': meta.type_meta_donne,
                    'nom_meta_donne': meta.nom_meta_donne,
                    'valeur_meta_donne': valeur_pour_template,
                    'order': type_order.get(meta.type_meta_donne, 99),
                    'valeur_texte': meta.valeur_texte,
                }
                meta_list.append(meta_data)
            
            # Trier par ordre personnalisé, puis par nom
            meta_list.sort(key=lambda x: (x['order'], x['nom_meta_donne']))
            
            # Grouper par type pour le template
            meta_grouped = {
                'textes': [m for m in meta_list if m['type_meta_donne'] in ['TEXTE', 'NOMBRE', 'DATE', 'HEURE', 'BOOLEEN', 'URL']],
                'fichiers': [m for m in meta_list if m['type_meta_donne'] == 'FICHIER'],
                'images': [m for m in meta_list if m['type_meta_donne'] == 'IMAGE'],
            }
            
            context = {
                'navire': navire,
                'date_generation': now.strftime('%d/%m/%Y à %H:%M'),
                'proprietaire_type_label': ExportNaviresFiltresView()._get_proprietaire_type_label(navire.proprietaire),
                'has_logo': logo_base64 is not None,
                'logo_base64': logo_base64,
                'has_navire_image': navire_image_base64 is not None,
                'navire_image_base64': navire_image_base64,
                'navire_image_name': navire_image_name,
                'now': now.date(),
                'in_30_days': in_30_days.date(),
                'meta_donnees': meta_list,  # Toutes les métadonnées triées
                'meta_grouped': meta_grouped,  # Métadonnées groupées par type
            }

            # Générer le HTML avec le template
            html_string = render_to_string('pdf/fiche_navire.html', context)
            
            # Générer le PDF
            filename = f"fiche_navire_{navire.nom_navire or 'sans_nom'}_{now.strftime('%Y-%m-%d')}.pdf"
            pdf_response = self._generate_pdf_response(html_string, filename)
            
            if pdf_response:
                return pdf_response
            else:
                return Response({
                    "error": "Erreur lors de la génération du PDF. Vérifiez les logs (IOError ou configuration wkhtmltopdf)."
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Navire.DoesNotExist:
            return Response({"error": "Navire introuvable."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Erreur export PDF non gérée: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({"error": f"Erreur interne lors de l'exportation PDF: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def export_all_pdf(self, request):
        """Exportation PDF de tous les navires (un PDF par navire, zippé)"""
        try:
            # Récupérer tous les navires
            navires = self.get_queryset()
            
            # Pour l'instant, retourner un message indiquant que c'est en développement
            return Response({
                "message": "L'export PDF de tous les navires est en cours de développement.",
                "navires_count": navires.count()
            })
            
        except Exception as e:
            logger.error(f"Erreur export all PDF: {str(e)}")
            return Response({"error": f"Erreur lors de l'export PDF: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Viewsets pour les modèles secondaires

class ProprietaireViewSet(viewsets.ModelViewSet):
    queryset = Proprietaire.objects.all()
    serializer_class = ProprietaireSerializer

    @action(detail=False, methods=['get'])
    def type_proprietaire_choices(self, request):
        return Response([choice[0] for choice in Proprietaire.TYPE_PROPRIETAIRE_CHOICES])

class ActiviteViewSet(viewsets.ModelViewSet):
    queryset = Activite.objects.all()
    serializer_class = ActiviteSerializer

class AssureurViewSet(viewsets.ModelViewSet):
    queryset = Assureur.objects.all()
    serializer_class = AssureurSerializer

class AssuranceViewSet(viewsets.ModelViewSet):
    queryset = Assurance.objects.all()
    serializer_class = AssuranceSerializer
    filterset_fields = ['navire']

    @action(detail=False, methods=['get'])
    def expired(self, request):
        """Retourne les assurances expirées"""
        today = timezone.now().date()
        assurances_expirees = self.queryset.filter(date_fin__lt=today)
        serializer = self.get_serializer(assurances_expirees, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def expiring_soon(self, request):
        """Retourne les assurances expirant dans les 30 jours"""
        today = timezone.now().date()
        in_30_days = today + timedelta(days=30)
        assurances_expirant = self.queryset.filter(
            date_fin__gte=today,
            date_fin__lte=in_30_days
        )
        serializer = self.get_serializer(assurances_expirant, many=True)
        return Response(serializer.data)

class MoteurViewSet(viewsets.ModelViewSet):
    queryset = Moteur.objects.all()
    serializer_class = MoteurSerializer

class VisiteViewSet(viewsets.ModelViewSet):
    queryset = Visite.objects.all()
    serializer_class = VisiteSerializer
    filterset_fields = ['navire']

    @action(detail=False, methods=['get'])
    def expired(self, request):
        """Retourne les visites avec permis expiré"""
        today = timezone.now().date()
        visites_expirees = self.queryset.filter(expiration_permis__lt=today)
        serializer = self.get_serializer(visites_expirees, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def expiring_soon(self, request):
        """Retourne les visites avec permis expirant dans les 30 jours"""
        today = timezone.now().date()
        in_30_days = today + timedelta(days=30)
        visites_expirant = self.queryset.filter(
            expiration_permis__gte=today,
            expiration_permis__lte=in_30_days
        )
        serializer = self.get_serializer(visites_expirant, many=True)
        return Response(serializer.data)

class DossierViewSet(viewsets.ModelViewSet):
    queryset = Dossier.objects.all()
    serializer_class = DossierSerializer
    filterset_fields = ['navire']

    @action(detail=False, methods=['get'])
    def expired(self, request):
        """Retourne les dossiers expirés"""
        today = timezone.now().date()
        dossiers_expires = self.queryset.filter(date_expiration__lt=today)
        serializer = self.get_serializer(dossiers_expires, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def expiring_soon(self, request):
        """Retourne les dossiers expirant dans les 30 jours"""
        today = timezone.now().date()
        in_30_days = today + timedelta(days=30)
        dossiers_expirant = self.queryset.filter(
            date_expiration__gte=today,
            date_expiration__lte=in_30_days
        )
        serializer = self.get_serializer(dossiers_expirant, many=True)
        return Response(serializer.data)


class MetaDonneViewSet(viewsets.ModelViewSet):
    queryset = MetaDonne.objects.all()
    serializer_class = MetaDonneSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_queryset(self):
        """Filtrer par navire si spécifié"""
        queryset = super().get_queryset()
        
        # Filtrer par navire si l'ID est fourni dans les query params
        navire_id = self.request.query_params.get('navire')
        if navire_id:
            queryset = queryset.filter(navire_id=navire_id)
        
        # Filtrer par type si spécifié
        type_meta = self.request.query_params.get('type')
        if type_meta:
            queryset = queryset.filter(type_meta_donne=type_meta)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Création avec gestion améliorée des fichiers"""
        try:
            print("=== Création MetaDonne ===")
            print(f"Méthode: {request.method}")
            print(f"Content-Type: {request.content_type}")
            print(f"Données brutes: {dict(request.data)}")
            print(f"Fichiers: {dict(request.FILES)}")
            
            # Préparer les données pour le serializer
            data = request.data.copy()
            
            # Gestion spéciale pour les fichiers/images
            type_meta = data.get('type_meta_donne')
            
            if type_meta in ['IMAGE', 'FICHIER']:
                # Pour les fichiers/images, on utilise le champ fichier_meta_donne
                if 'fichier_meta_donne' not in data and request.FILES:
                    # Chercher un fichier dans les FILES
                    for key in request.FILES:
                        if 'fichier' in key.lower() or 'file' in key.lower():
                            data['fichier_meta_donne'] = request.FILES[key]
                            break
                
                # Pour les fichiers, on nettoie valeur_texte
                data['valeur_texte'] = None
            else:
                # Pour les autres types, on nettoie le fichier s'il existe
                if 'fichier_meta_donne' in data:
                    del data['fichier_meta_donne']
            
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            
            # Sauvegarde de l'instance
            self.perform_create(serializer)
            
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
            
        except Exception as e:
            print(f"Erreur détaillée lors de la création: {str(e)}")
            import traceback
            traceback.print_exc()
            
            return Response(
                {
                    "error": str(e), 
                    "detail": "Erreur lors de l'enregistrement de la métadonnée. "
                              "Assurez-vous que pour les types FICHIER/IMAGE, vous envoyez un fichier."
                },
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def update(self, request, *args, **kwargs):
        """Mise à jour avec gestion améliorée des fichiers"""
        try:
            print("=== Mise à jour MetaDonne ===")
            print(f"Méthode: {request.method}")
            print(f"Content-Type: {request.content_type}")
            print(f"Données brutes: {dict(request.data)}")
            print(f"Fichiers: {dict(request.FILES)}")
            
            instance = self.get_object()
            data = request.data.copy()
            
            # Gestion spéciale pour les fichiers/images
            type_meta = data.get('type_meta_donne', instance.type_meta_donne)
            
            if type_meta in ['IMAGE', 'FICHIER']:
                # Pour les fichiers/images
                if 'fichier_meta_donne' not in data and request.FILES:
                    for key in request.FILES:
                        if 'fichier' in key.lower() or 'file' in key.lower():
                            data['fichier_meta_donne'] = request.FILES[key]
                            break
                
                # Pour les fichiers, on nettoie valeur_texte
                data['valeur_texte'] = None
            else:
                # Pour les autres types
                if 'fichier_meta_donne' in data:
                    del data['fichier_meta_donne']
            
            serializer = self.get_serializer(instance, data=data, partial=kwargs.get('partial', False))
            serializer.is_valid(raise_exception=True)
            
            self.perform_update(serializer)
            
            return Response(serializer.data)
            
        except Exception as e:
            print(f"Erreur lors de la mise à jour: {str(e)}")
            import traceback
            traceback.print_exc()
            
            return Response(
                {
                    "error": str(e), 
                    "detail": "Erreur lors de la mise à jour de la métadonnée"
                },
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Télécharger un fichier attaché à une métadonnée"""
        meta_donne = self.get_object()
        
        if meta_donne.type_meta_donne not in ['FICHIER', 'IMAGE']:
            return Response(
                {"error": "Cette métadonnée ne contient pas de fichier"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not meta_donne.fichier_meta_donne:
            return Response(
                {"error": "Aucun fichier attaché à cette métadonnée"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Rediriger vers l'URL du fichier
        file_url = meta_donne.fichier_meta_donne.url
        return Response({"url": request.build_absolute_uri(file_url)})
    
    def get_serializer_context(self):
        """Ajouter le request au contexte du serializer"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=False, methods=['get'])
    def type_meta_donne_choices(self, request):
        """Retourne les choix disponibles pour le type de métadonnée"""
        choices = [choice[0] for choice in MetaDonne.TYPE_CHOICES]
        return Response(choices)


# Vue de test pour les uploads
class TestUploadView(APIView):
    """Vue pour tester l'upload de fichiers"""
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        try:
            print("=== Test Upload ===")
            print(f"FILES: {dict(request.FILES)}")
            print(f"DATA: {dict(request.data)}")
            
            return Response({
                "message": "Upload test réussi",
                "files_received": list(request.FILES.keys()),
                "data_received": dict(request.data)
            })
            
        except Exception as e:
            print(f"Erreur test upload: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )