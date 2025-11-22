import { NextRequest, NextResponse } from "next/server";

// Types for the third-party API response
interface ThirdPartyPost {
  id: number;
  title: string;
  body: string;
  userId: number;
}

interface Restaurant {
  id: number;
  name: string;
  cuisine: string;
  rating: string;
  priceRange: string;
  address: string;
  phone: string;
  description: string;
  website: string;
  image: string;
}

// Example third-party API endpoint (using JSONPlaceholder as a placeholder)
const THIRD_PARTY_API_URL = "https://jsonplaceholder.typicode.com/posts";

export async function GET(request: NextRequest) {
  try {
    // Get query parameters from the request
    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location");
    const cuisines = searchParams.get("cuisines");
    const diets = searchParams.get("diets");
    const prices = searchParams.get("prices");

    let response: Response;
    try {
      // In a real implementation, you would pass these parameters to your third-party API
      // For this example, we'll fetch some placeholder data and transform it
      response = await fetch(`${THIRD_PARTY_API_URL}?_limit=5`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Add any required API keys or authentication headers here
          // 'Authorization': `Bearer ${process.env.THIRD_PARTY_API_KEY}`,
        },
        // Add a timeout
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
    } catch (error) {
      console.error("Fetch Error:", error);
      throw new Error(error instanceof Error ? error.message : String(error));
    }

    if (!response.ok) {
      throw new Error(
        `Third-party API error: ${response.status} ${response.statusText}`
      );
    }

    const thirdPartyData: ThirdPartyPost[] = await response.json();

    // Transform the third-party data into restaurant format
    // This is just an example transformation
    const restaurants: Restaurant[] = thirdPartyData.map(
      (item: ThirdPartyPost, index: number) => ({
        id: item.id,
        name: `Restaurant ${item.title.split(" ").slice(0, 2).join(" ")}`,
        cuisine:
          cuisines?.split(",")[index % (cuisines?.split(",").length || 1)] ||
          "International",
        rating: (3.5 + Math.random() * 1.5).toFixed(1),
        priceRange:
          prices?.split(",")[index % (prices?.split(",").length || 1)] || "$$",
        address: `123 Main St, ${location || "Unknown City"}`,
        phone: `(555) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        description: item.body.substring(0, 100) + "...",
        website: `https://restaurant${item.id}.example.com`,
        image: `https://picsum.photos/300/200?random=${item.id}`,
      })
    );

    // Return the transformed data
    return NextResponse.json({
      success: true,
      data: {
        restaurants,
        location: location || "Unknown Location",
        filters: {
          cuisines: cuisines?.split(",") || [],
          diets: diets?.split(",") || [],
          prices: prices?.split(",") || [],
        },
        total: restaurants.length,
      },
    });
  } catch (error) {
    console.error("API Error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        data: null,
      },
      { status: 500 }
    );
  }
}
