import { Brand } from "@/types/brand";
import brandsData from "./brandsData";

const Brands = () => {
  return (
    <section className="py-20 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
      <div className="container mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase text-gray-400 mb-3">
            <span className="w-8 h-px bg-gray-300 inline-block" />
            Trusted By
            <span className="w-8 h-px bg-gray-300 inline-block" />
          </div>
          <h3 className="text-2xl font-black text-gray-800 dark:text-white">
            Our Clients &amp; Partners
          </h3>
        </div>

        {/* Brands */}
        <div className="flex flex-wrap items-center justify-center gap-6 px-8">
          {brandsData.map((brand) => (
            <SingleBrand key={brand.id} brand={brand} />
          ))}
        </div>

      </div>
    </section>
  );
};

export default Brands;

const SingleBrand = ({ brand }: { brand: Brand }) => {
  const { href, image, name } = brand;
  return (
    <div className="mx-3 flex w-full max-w-[120px] items-center justify-center py-[15px] sm:mx-4 xl:mx-6 2xl:mx-8">
      <h4 className="sr-only">OUR CLIENTS</h4>
      <a href={href} target="_blank" rel="nofollow noreferrer" className="relative h-10 w-full opacity-50 hover:opacity-100 grayscale hover:grayscale-0 transition-all duration-300">
        <img src={image} alt={name} className="w-[100px] h-[100px] object-contain mx-auto hover:scale-110 transition-transform duration-300" />
      </a>
    </div>
  );
};