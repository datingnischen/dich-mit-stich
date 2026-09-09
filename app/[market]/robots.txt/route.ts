import { GET as getMarketRobots } from "@/app/market-robots/[market]/route";

export const dynamic = "force-static";

type RouteProps = {
  params: Promise<{ market: string }>;
};

export function generateStaticParams() {
  return [{ market: "at" }, { market: "ch" }];
}

export function GET(request: Request, context: RouteProps) {
  return getMarketRobots(request, context);
}
