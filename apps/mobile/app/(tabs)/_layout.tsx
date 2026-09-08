import { Tabs } from "expo-router";
import { TabBar } from "../../components/tab-bar";
import { color } from "../../lib/theme";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: color.paper },
      }}
    />
  );
}
