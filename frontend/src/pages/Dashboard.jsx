import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  HiArrowRight,
  HiExclamation,
  HiClock,
  HiCheckCircle,
  HiPlus,
  HiUser,
  HiCollection,
  HiChevronRight,
} from "react-icons/hi";
import { FaShip, FaFileAlt } from "react-icons/fa";
import { API_BASE_URL } from "../config/api";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ======================================================================
     STAT CARD (avec couleurs améliorées)
  ====================================================================== */
  const StatCard = ({ title, value, icon, description, color = "slate" }) => {
    const colorMap = {
      slate: {
        bg: "bg-slate-50",
        border: "border-slate-200",
        text: "text-slate-600",
        accent: "text-slate-700"
      },
      blue: {
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-600",
        accent: "text-blue-700"
      },
      red: {
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-600",
        accent: "text-red-700"
      },
      orange: {
        bg: "bg-orange-50",
        border: "border-orange-200",
        text: "text-orange-600",
        accent: "text-orange-700"
      },
      emerald: {
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        text: "text-emerald-600",
        accent: "text-emerald-700"
      }
    };

    const colors = colorMap[color];

    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all duration-200 backdrop-blur-sm bg-white/80">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              {title}
            </p>
            <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
            {description && (
              <p className="text-xs text-slate-500 mt-1">{description}</p>
            )}
          </div>

          <div className={`p-3 rounded-xl ${colors.bg} ${colors.border} ${colors.text}`}>
            {icon}
          </div>
        </div>
      </div>
    );
  };

  /* NAVIRE CARD */
  const NavireRecentCard = ({ navire, index }) => (
    <Link
      to={`/navires/${navire.id}`}
      className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 group"
    >
      <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center font-medium text-slate-700 border border-slate-200">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-slate-800 text-base truncate group-hover:text-slate-900">
          {navire.nom || "Sans nom"}
        </h3>

        <div className="flex items-center gap-3 text-sm text-slate-600 mt-1">
          <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-xs border border-slate-200">
            <HiCollection className="w-3 h-3" />
            {navire.immatriculation || "N/A"}
          </span>

          {navire.proprietaire && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <HiUser className="w-3 h-3" />
              {navire.proprietaire}
            </span>
          )}
        </div>
      </div>

      <HiArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-all transform group-hover:translate-x-0.5" />
    </Link>
  );

  
  useEffect(() => {
    const loadData = async () => {
      try {
        
        const [alertesRes, naviresRes] = await Promise.all([
          fetch(`${API_BASE_URL}/alertes/summary/`),
          fetch(`${API_BASE_URL}/navires/`),         
        ]);

        if (!alertesRes.ok || !naviresRes.ok)
          throw new Error("Erreur API ou serveur indisponible");

        const alertes = await alertesRes.json();
        const navires = await naviresRes.json();

        const totalNavires = navires.length;
        const recentNavires = navires
          .sort((a, b) => b.id - a.id)
          .slice(0, 5)
          .map((n) => ({
            id: n.id,
            nom: n.nom_navire,
            immatriculation: n.num_immatricule,
            proprietaire: n.proprietaire?.nom_proprietaire || null,
          }));

        setStats({
          ...alertes,
          totalNavires,
          naviresRecents: recentNavires,
        });
      } catch (err) {
        console.error(" Erreur chargement données:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  /* LOADER */
  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="animate-spin h-10 w-10 border-2 border-blue-400 border-t-transparent rounded-full"></div>
        <p className="ml-4 text-slate-600">Chargement des données...</p>
      </div>
    );

  /* ERROR */
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-sm border border-slate-200 text-center max-w-sm">
          <HiExclamation className="w-10 h-10 text-slate-500 mx-auto" />
          <h2 className="text-lg font-semibold mt-2 text-slate-800">Erreur de connexion</h2>
          <p className="text-slate-600 mt-2">{error}</p>
          <p className="text-sm text-slate-500 mt-4">
            Vérifiez que le serveur Django est démarré sur: {API_BASE_URL}
          </p>
        </div>
      </div>
    );

  /* PAGE */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Tableau de Bord</h1>
            <p className="text-slate-600 text-sm">Résumé de votre flotte</p>
          </div>

          <Link
            to="/navires/new"
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2.5 rounded-lg hover:from-blue-600 hover:to-blue-700 flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow"
          >
            <HiPlus className="w-4 h-4" />
            Nouveau navire
          </Link>
        </div>

        {/* CARDS STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Total Navires"
            value={stats?.totalNavires || 0}
            icon={<FaShip className="w-6 h-6" />}
            description="Navires enregistrés"
            color="blue"
          />
          <StatCard
            title="Expirés"
            value={stats?.documentsExpires || 0}
            icon={<HiExclamation className="w-6 h-6" />}
            description="Action requise"
            color="red"
          />
          <StatCard
            title="Bientôt expirés"
            value={stats?.documentsBientotExpires || 0}
            icon={<HiClock className="w-6 h-6" />}
            description="Sous 30 jours"
            color="orange"
          />
          <StatCard
            title="Valides"
            value={stats?.total_valide || 0}
            icon={<HiCheckCircle className="w-6 h-6" />}
            description="En conformité"
            color="emerald"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* COLONNE GAUCHE : ALERTES */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/90 backdrop-blur-sm border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-red-100/50 border-b border-red-200">
                <h2 className="font-semibold text-lg flex items-center gap-2 text-red-800">
                  <HiExclamation className="text-red-600" /> Documents Expirés
                </h2>
              </div>

              <div>
                {stats?.liste_expires?.length > 0 ? (
                  stats.liste_expires.map((item, idx) => (
                    <Link
                      key={idx}
                      to={`/navires/${item.navire_id}`}
                      className="flex justify-between p-4 border-b border-slate-100 hover:bg-red-50/50 transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center text-red-600 border border-red-200">
                          <FaShip className="w-4 h-4" />
                        </div>

                        <div>
                          <p className="font-semibold text-slate-800">{item.navire_nom}</p>
                          <p className="text-sm text-slate-600">
                            {item.document} —{" "}
                            <span className="text-red-700 font-medium">
                              Expiré le{" "}
                              {new Date(item.date).toLocaleDateString("fr-FR")}
                            </span>
                          </p>
                        </div>
                      </div>

                      <HiChevronRight className="text-slate-400 group-hover:text-red-600 transition-all" />
                    </Link>
                  ))
                ) : (
                  <div className="p-6 text-center">
                    <HiCheckCircle className="text-emerald-500 w-10 h-10 mx-auto" />
                    <p className="text-slate-600 mt-2">Aucun document expiré</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-orange-100/50 border-b border-orange-200">
                <h2 className="font-semibold text-lg flex items-center gap-2 text-orange-800">
                  <HiClock className="text-orange-600" /> Bientôt Expirés
                </h2>
              </div>

              <div className="p-6 space-y-3">
                {stats?.documentsPresqueExpires?.length > 0 ? (
                  stats.documentsPresqueExpires
                    .sort(
                      (a, b) =>
                        new Date(a.expire_le) - new Date(b.expire_le)
                    )
                    .map((item, idx) => {
                      const days = Math.round(
                        (new Date(item.expire_le) - new Date()) /
                          (1000 * 60 * 60 * 24)
                      );

                      return (
                        <Link
                          key={idx}
                          to={`/navires/${item.navire_id}`}
                          className="flex justify-between p-3 border border-orange-200 rounded-xl hover:bg-orange-50/70 hover:border-orange-300 transition-all duration-200 group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center border border-orange-200">
                              <FaFileAlt className="w-3 h-3" />
                            </div>

                            <div>
                              <p className="font-medium text-slate-800">{item.navire}</p>
                              <p className="text-xs text-slate-600">{item.type}</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-orange-700 font-semibold">{days} j</p>
                            <p className="text-xs text-slate-500">
                              {new Date(item.expire_le).toLocaleDateString(
                                "fr-FR"
                              )}
                            </p>
                          </div>
                        </Link>
                      );
                    })
                ) : (
                  <div className="text-center">
                    <HiCheckCircle className="text-emerald-500 w-10 h-10 mx-auto" />
                    <p className="text-slate-600">Aucune alerte préventive</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* COLONNE DROITE : NAVIRES RECENTS */}
          <div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="font-semibold text-lg text-slate-800">Navires Récents</h2>
                    <p className="text-xs text-slate-600">
                      {stats?.naviresRecents?.length || 0} sur {stats?.totalNavires || 0}
                    </p>
                  </div>

                  <Link
                    to="/navires"
                    className="text-blue-600 text-sm hover:text-blue-800 transition-colors"
                  >
                    Voir tout
                  </Link>
                </div>
              </div>

              <div className="p-6 space-y-3">
                {stats?.naviresRecents?.length > 0 ? (
                  stats.naviresRecents.map((n, i) => (
                    <NavireRecentCard key={n.id} navire={n} index={i} />
                  ))
                ) : (
                  <div className="text-center py-6">
                    <FaShip className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-slate-500 mt-2">Aucun navire récent</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}