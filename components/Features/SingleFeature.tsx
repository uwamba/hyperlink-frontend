import { Feature } from "@/types/feature";

const SingleFeature = ({ feature }: { feature: Feature }) => {
  const { icon, title, paragraph } = feature;

  return (
    <div className="group relative bg-white dark:bg-gray-900 rounded-2xl p-6 flex flex-col h-full border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-xl hover:shadow-blue-50 dark:hover:shadow-blue-950/30 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 dark:bg-blue-950/30 rounded-bl-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Icon */}
      <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xl mb-5 group-hover:bg-blue-600 group-hover:text-white dark:group-hover:bg-blue-600 transition-all duration-300">
        {icon}
      </div>

      <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed flex-grow">
        {paragraph}
      </p>

      {/* Bottom accent line */}
      <div className="mt-4 h-0.5 w-0 bg-blue-500 group-hover:w-full transition-all duration-500 rounded-full" />
    </div>
  );
};

export default SingleFeature;