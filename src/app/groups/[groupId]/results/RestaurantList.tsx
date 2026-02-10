"use client";

import type { Restaurant } from "@/types";
import { useRestaurants } from "@/hooks/useRestaurants";
import { getFilteredCuisines } from "@/utils/cuisine";

type RestaurantListProps = {
  location: string;
  cuisines: string[];
  latitude?: number;
  longitude?: number;
};

const RestaurantCard = ({ restaurant }: { restaurant: Restaurant }) => (
  <div className="card p-6">
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
            <h3 className="text-xl font-semibold text-neutral-900">
              {restaurant.name}
            </h3>
            <p className="text-sm text-neutral-400">{restaurant.cuisine}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1">
              <span className="text-warning">★</span>
              <span className="font-medium text-neutral-100">
                {restaurant.rating}
              </span>
            </div>
            <p className="text-sm text-neutral-400">{restaurant.priceRange}</p>
          </div>
        </div>

        <p className="text-neutral-700 mt-2 text-sm line-clamp-2">
          {restaurant.description || `A ${restaurant.rating}★ restaurant.`}
        </p>

        <p className="text-neutral-700">{restaurant.type}</p>

        <div className="mt-4 space-y-1 text-sm text-neutral-400">
          <p>{restaurant.address}</p>
          <p>{restaurant.phone}</p>
        </div>

        <div className="mt-4 flex gap-2">
          <a
            href={restaurant.website}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-sm"
          >
            Visit Website
          </a>
          {restaurant.phone && (
            <a
              href={`tel:${restaurant.phone.replace(/[^\d]/g, "")}`}
              className="btn-outline text-sm"
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-neutral-400">Loading restaurants...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="bg-error-light border border-error rounded-lg p-4">
          <h3 className="text-error-dark font-medium">
            Error Loading Restaurants
          </h3>
          <p className="text-error text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || !data.restaurants.length) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="text-center text-neutral-400">
          <p>No restaurants found for your criteria.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="heading-sm text-neutral-100 mb-2">
          Restaurants in {location}
        </h2>
        <div className="flex flex-wrap gap-2 text-sm text-neutral-400">
          {data.filters.cuisines.length > 0 && (
            <span className="bg-primary-100 text-primary-800 px-2 py-1 rounded">
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
