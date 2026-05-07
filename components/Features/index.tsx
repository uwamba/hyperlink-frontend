import SingleFeature from "./SingleFeature";
import featuresData from "./featuresData";

const FeaturesSection = () => {
  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-950 relative overflow-hidden" id="Services">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-blue-100 dark:bg-blue-950/30 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl opacity-50" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-50 dark:bg-blue-950/20 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl opacity-50" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase text-blue-600 dark:text-blue-400 mb-4">
            <span className="w-8 h-px bg-blue-600 dark:bg-blue-400" />
            What We Offer
            <span className="w-8 h-px bg-blue-600 dark:bg-blue-400" />
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-4">
            Our IT Services
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed">
            From smart home automation to enterprise infrastructure, we deliver end-to-end technology solutions tailored to your needs.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuresData.map((feature) => (
            <SingleFeature key={feature.id} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;