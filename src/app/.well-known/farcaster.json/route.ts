function withValidProperties(
  properties: Record<string, undefined | string | string[]>
) {
  return Object.fromEntries(
    Object.entries(properties).filter(([key, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return !!value;
    })
  );
}

export async function GET() {
  const URL = process.env.NEXT_PUBLIC_URL || "https://b.rozo.ai";

  return Response.json({
    accountAssociation: {
      header: process.env.FARCASTER_HEADER,
      payload: process.env.FARCASTER_PAYLOAD,
      signature: process.env.FARCASTER_SIGNATURE,
    },
    frame: withValidProperties({
      version: "1",
      name: "Rozo Banana",
      subtitle: "AI Image Generation",
      description: "Create AI images. Earn points!",
      screenshotUrls: [],
      iconUrl: "https://b.rozo.ai/banana.svg",
      splashImageUrl: "https://b.rozo.ai/banana.svg",
      splashBackgroundColor: "#ffffff",
      homeUrl: URL,
      webhookUrl: `${URL}api/webhook`,
      primaryCategory: "art-creativity",
      tags: ["rozo", "banana", "AI", "image", "generation"],
      heroImageUrl: "https://b.rozo.ai/banana.svg",
      tagline: "Create AI images. Earn points!",
      ogTitle: "Rozo Banana",
      ogDescription: "Create AI images. Earn points!",
      ogImageUrl: "https://b.rozo.ai/banana.svg",
      buttonTitle: "Buy and Earn Rewards",
    }),
    miniapp: {
      version: "1",
      name: "Rozo Banana",
      iconUrl: "https://b.rozo.ai/banana.svg",
      homeUrl: URL,
      imageUrl: "https://b.rozo.ai/banana.svg",
      buttonTitle: "Buy and Earn Rewards",
      splashImageUrl: "https://b.rozo.ai/banana.svg",
      splashBackgroundColor: "#ffffff",
      // webhookUrl: `${URL}api/webhook`,
    },
    baseBuilder: {
      allowedAddress: "0x596215a85AF60197C111A2b002cE68253fb0B7f4",
      allowedAddresses: ["0x596215a85AF60197C111A2b002cE68253fb0B7f4"],
    },
  });
}
