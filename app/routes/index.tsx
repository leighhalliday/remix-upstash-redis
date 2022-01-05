import type { LoaderFunction } from "remix";
import { useLoaderData } from "remix";
import { hmget } from "@upstash/redis";

type LoaderData = {
  features: Record<string, boolean>;
};

const loadFeatures = async (keys: Array<string>) => {
  const { data } = await hmget("features", ...keys);

  const features = keys.reduce<Record<string, boolean>>((acc, key, index) => {
    acc[key] = data[index] === "1";
    return acc;
  }, {});

  return features;
};

export const loader: LoaderFunction = async (): Promise<LoaderData> => {
  const features = await loadFeatures(["chart", "graph", "fake"]);
  return { features };
};

export default function Index() {
  const { features } = useLoaderData<LoaderData>();

  return (
    <div>
      <h1>Dashboard</h1>
      {features.chart ? <h2>Chart</h2> : <h2>No Chart</h2>}
      {features.graph ? <h2>Graph</h2> : <h2>No Graph</h2>}
    </div>
  );
}
