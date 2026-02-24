export default function PageSectionLoader({ show }) {

  if (!show) return null;

  return (
    <div className="absolute inset-0 bg-white bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-40">

      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        {/* <p className="text-sm text-gray-600">Loading...</p> */}
      </div>

    </div>
  );
}