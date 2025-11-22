"use client";

import Image from "next/image";
import { useRestaurants, Restaurant } from "@/hooks/useRestaurants";

interface RestaurantListProps {
  location: string;
  cuisines: string[];
  diets: string[];
  prices: string[];
}

const RestaurantCard = ({ restaurant }: { restaurant: Restaurant }) => (
  <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
    <div className="flex items-start gap-4">
      <Image
        src={restaurant.image}
        alt={restaurant.name}
        width={96}
        height={96}
        className="w-24 h-24 rounded-lg object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src =
            "https://via.placeholder.com/96x96/cccccc/666666?text=No+Image";
        }}
      />
      <div className="flex-1">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {restaurant.name}
            </h3>
            <p className="text-sm text-gray-600">{restaurant.cuisine}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1">
              <span className="text-yellow-500">★</span>
              <span className="font-medium">{restaurant.rating}</span>
            </div>
            <p className="text-sm text-gray-600">{restaurant.priceRange}</p>
          </div>
        </div>

        <p className="text-gray-700 mt-2 text-sm line-clamp-2">
          {restaurant.description}
        </p>

        <div className="mt-4 space-y-1 text-sm text-gray-600">
          <p>{restaurant.address}</p>
          <p>{restaurant.phone}</p>
        </div>

        <div className="mt-4 flex gap-2">
          <a
            href={restaurant.website}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            Visit Website
          </a>
          <a
            href={`tel:${restaurant.phone.replace(/[^\d]/g, "")}`}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors"
          >
            Call
          </a>
        </div>
      </div>
    </div>
  </div>
);

const RestaurantList = ({
  location,
  cuisines,
  diets,
  prices,
}: RestaurantListProps) => {
  const { data, isLoading, error } = useRestaurants({
    location,
    cuisines,
    diets,
    prices,
    enabled: true,
  });

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading restaurants...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">
            Error Loading Restaurants
          </h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || !data.restaurants.length) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="text-center text-gray-600">
          <p>No restaurants found for your criteria.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-200 mb-2">
          Restaurants in {data.location}
        </h2>
        <div className="flex flex-wrap gap-2 text-sm text-gray-600">
          {data.filters.cuisines.length > 0 && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Cuisines: {data.filters.cuisines.join(", ")}
            </span>
          )}
          {data.filters.diets.length > 0 && (
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
              Diets: {data.filters.diets.join(", ")}
            </span>
          )}
          {data.filters.prices.length > 0 && (
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
              Price: {data.filters.prices.join(", ")}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Found {data.total} restaurant{data.total !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="space-y-6">
        {data.restaurants.map((restaurant) => (
          <RestaurantCard key={restaurant.id} restaurant={restaurant} />
        ))}
      </div>
    </div>
  );
};

export default RestaurantList;
