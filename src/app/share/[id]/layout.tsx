import { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    // Try to fetch image data
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "https://banana.rozo.ai";

    let imageUrl = "";

    if (id.includes("https")) {
      imageUrl = decodeURIComponent(id);
    } else {
      imageUrl = `https://eslabobvkchgpokxszwv.supabase.co/storage/v1/object/public/generated-images/rozobanana/${decodeURIComponent(
        id
      )}`;
    }

    return {
      title: "AI-Generated Image | ROZO Banana",
      description:
        "Check out this amazing AI-generated image created with ROZO Banana! Transform your ideas into stunning visuals.",
      openGraph: {
        title: "AI-Generated Image | ROZO Banana",
        description:
          "Check out this amazing AI-generated image created with ROZO Banana! Transform your ideas into stunning visuals.",
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: "AI-Generated Image",
          },
        ],
        url: `${baseUrl}/share/${id}`,
        siteName: "ROZO Banana",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: "AI-Generated Image | ROZO Banana",
        description:
          "Check out this amazing AI-generated image created with ROZO Banana! Transform your ideas into stunning visuals.",
        images: [imageUrl],
        creator: "@ROZOai",
        site: "@ROZOai",
      },
      other: {
        "twitter:card": "summary_large_image",
        "twitter:title": "AI-Generated Image | ROZO Banana",
        "twitter:description":
          "Check out this amazing AI-generated image created with ROZO Banana! Transform your ideas into stunning visuals.",
        "twitter:image": imageUrl,
        "twitter:creator": "@ROZOai",
        "twitter:site": "@ROZOai",
      },
    };
  } catch (error) {
    return {
      title: "AI-Generated Image | ROZO Banana",
      description:
        "Check out this amazing AI-generated image created with ROZO Banana!",
    };
  }
}

export default function ShareLayout({ children }: Props) {
  return <>{children}</>;
}
