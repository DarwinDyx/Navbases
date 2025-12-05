import axios from 'axios';
import { API_BASE_URL } from './config/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export const downloadFileFromAPI = async (url, defaultFileName = 'download.csv') => {
  try {
    const response = await apiClient.get(url, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const contentDisposition = response.headers['content-disposition'];
    let filename = defaultFileName;

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch && filenameMatch.length > 1) {
        filename = filenameMatch[1];
      }
    }

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);

  } catch (error) {
    console.error("Erreur lors du téléchargement du fichier:", error);
    alert("Impossible de télécharger le fichier.");
  }
};