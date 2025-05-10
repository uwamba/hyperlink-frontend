import { Feature } from "@/types/feature";

const SingleFeature = ({ feature }: { feature: Feature }) => {
  const { icon, title, paragraph } = feature;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md hover:shadow-lg transition duration-300 p-6 flex flex-col h-full">
      <div className="flex items-center justify-center h-14 w-14 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-white text-xl mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed flex-grow">{paragraph}</p>
    </div>
  );
};

export default SingleFeature;
