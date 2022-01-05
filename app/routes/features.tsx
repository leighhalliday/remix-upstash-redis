import type { LoaderFunction, ActionFunction } from "remix";
import { useLoaderData, Form, redirect, json } from "remix";
import { hset, hgetall, hdel } from "@upstash/redis";
import styles from "~/styles/features.css";

export function links() {
  return [{ rel: "stylesheet", href: styles }];
}

type LoaderData = {
  features: Array<[string, boolean]>;
};

const loadAllFeatures = async () => {
  const { data } = await hgetall("features");
  const features: Array<[string, boolean]> = [];

  for (let i = 0; i < data.length; i += 2) {
    features.push([data[i], data[i + 1] === "1"]);
  }

  return features.sort((a, b) => {
    if (a[0] > b[0]) return 1;
    if (a[0] < b[0]) return -1;
    return 0;
  });
};

export const loader: LoaderFunction = async (): Promise<LoaderData> => {
  const features = await loadAllFeatures();
  return { features };
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const feature = formData.get("feature") as string;
  const action = formData.get("_action") as string;

  if (!feature || feature.length === 0) {
    // This isn't currently displayed in our component
    return json({ error: "Please provide a feature" });
  }

  switch (action) {
    case "create":
    case "enable":
      await hset("features", feature, 1);
      break;
    case "disable":
      await hset("features", feature, 0);
      break;
    case "delete":
      await hdel("features", feature);
      break;
  }

  return redirect("/features");
};

export default function Features() {
  return (
    <div>
      <h1>Features</h1>
      <AddFeature />
      <FeatureList />
    </div>
  );
}

const AddFeature = () => {
  return (
    <Form method="post" replace>
      <input type="hidden" name="_action" value="create" />
      <input type="text" name="feature" required placeholder="name" />
      <button type="submit">Add</button>
    </Form>
  );
};

const FeatureList = () => {
  const { features } = useLoaderData<LoaderData>();

  return (
    <ul>
      {features.map(([feature, active]) => (
        <li key={feature}>
          <Form method="post" replace>
            <input
              type="hidden"
              name="_action"
              value={active ? "disable" : "enable"}
            />
            <input type="hidden" name="feature" value={feature} />
            <button type="submit" className="btn-naked">
              {active ? "✅" : "☑️"}
            </button>
          </Form>

          <span>{feature}</span>

          <Form method="post" replace>
            <input type="hidden" name="_action" value="delete" />
            <input type="hidden" name="feature" value={feature} />
            <button type="submit">Delete</button>
          </Form>
        </li>
      ))}
    </ul>
  );
};
