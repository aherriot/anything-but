"use client";

import { useRestaurants, Restaurant } from "@/hooks/useRestaurants";
import { getFilteredCuisines } from "@/utils/utils";

type RestaurantListProps = {
  location: string;
  cuisines: string[];
  latitude?: number;
  longitude?: number;
};

const RestaurantCard = ({ restaurant }: { restaurant: Restaurant }) => (
  <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
    <div className="flex items-start gap-4">
      {restaurant.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/places/photo?photoReference=${encodeURIComponent(restaurant.photoUrl)}&maxWidth=400&maxHeight=400`}
          alt={restaurant.name}
          className="w-32 h-32 object-cover rounded-lg flex-shrink-0"
        />
      )}
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
              <span className="font-medium text-black">
                {restaurant.rating}
              </span>
            </div>
            <p className="text-sm text-gray-600">{restaurant.priceRange}</p>
          </div>
        </div>

        <p className="text-gray-700 mt-2 text-sm line-clamp-2">
          {restaurant.description || `A ${restaurant.rating}★ restaurant.`}
        </p>

        <p className="text-gray-700">{restaurant.type}</p>

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
          {restaurant.phone && (
            <a
              href={`tel:${restaurant.phone.replace(/[^\d]/g, "")}`}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors"
            >
              Call
            </a>
          )}
        </div>
      </div>
    </div>
  </div>
);

const RestaurantList = ({
  location,
  cuisines,
  latitude,
  longitude,
}: RestaurantListProps) => {
  const { data, isLoading, error } = useRestaurants({
    cuisines,
    latitude,
    longitude,
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

  console.log(data.restaurants);

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-200 mb-2">
          Restaurants in {location}
        </h2>
        <div className="flex flex-wrap gap-2 text-sm text-gray-600">
          {data.filters.cuisines.length > 0 && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Cuisines:{" "}
              {getFilteredCuisines(data.filters.cuisines)
                .map((cuisine) => cuisine.name)
                .join(", ")}
            </span>
          )}
        </div>
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
