import { Feature } from "@/types/feature";

const SingleFeature = ({ feature }: { feature: Feature }) => {
  const { icon, title, paragraph } = feature;
  return (
    <div className="w-full">
      <div className="wow fadeInUp" data-wow-delay=".15s">
        {/* Box with background color, border radius, padding, and flex layout */}
        <div className="border border-primary rounded-lg p-6 bg-blue-50 dark:bg-blue-900 flex flex-col justify-between h-[400px]">
          {/* Flex container for icon and title */}
          <div className="flex items-center mb-5">
            {/* Icon with background and border radius */}
            <div className="mr-3 flex h-[40px] w-[40px] items-center justify-center rounded-full bg-primary bg-opacity-10 text-primary">
              {icon}
            </div>
            {/* Title */}
            <h3 className="text-xl font-bold text-black dark:text-white sm:text-2xl lg:text-xl xl:text-2xl">
              {title}
            </h3>
          </div>
          {/* Paragraph with text color and spacing */}
          <p className="flex-grow text-base font-medium leading-relaxed text-body-color dark:text-gray-400">
            {paragraph}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SingleFeature;
