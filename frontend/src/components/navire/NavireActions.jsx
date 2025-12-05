import { HiPencil, HiTrash, HiDownload } from "react-icons/hi";

export default function NavireActions({ onEdit, onDelete, onExportCSV, onExportPDF }) {
  return (
    <div className="flex flex-wrap gap-4 justify-center sm:justify-end">
      
      
      {/* Export PDF - Icône bleue */}
      <button
        onClick={onExportPDF}
        className="flex items-center gap-2 px-5 py-3 border border-gray-200 bg-white text-gray-700 rounded-xl hover:bg-gray-50 hover:shadow-md transition-all duration-200 font-medium shadow-sm group"
      >
        <HiDownload className="w-4 h-4 text-blue-500 group-hover:text-blue-600" />
        Export PDF
      </button>
      
      {/* Modifier - Icône orange */}
      <button
        onClick={onEdit}
        className="flex items-center gap-2 px-5 py-3 border border-gray-200 bg-white text-gray-700 rounded-xl hover:bg-gray-50 hover:shadow-md transition-all duration-200 font-medium shadow-sm group"
      >
        <HiPencil className="w-4 h-4 text-amber-500 group-hover:text-amber-600" />
        Modifier le navire
      </button>
      
      {/* Supprimer - Icône rouge */}
      <button
        onClick={onDelete}
        className="flex items-center gap-2 px-5 py-3 border border-gray-200 bg-white text-gray-700 rounded-xl hover:bg-gray-50 hover:shadow-md transition-all duration-200 font-medium shadow-sm group"
      >
        <HiTrash className="w-4 h-4 text-red-500 group-hover:text-red-600" />
        Supprimer
      </button>
    </div>
  );
}