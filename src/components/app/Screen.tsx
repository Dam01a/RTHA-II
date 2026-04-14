import { View, ScrollView, type ScrollViewProps, type ViewProps } from "react-native";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

type ScreenProps = ScrollViewProps & {
  title: string;
  subtitle?: string;
  contentClassName?: string;
};

export function Screen({ title, subtitle, contentClassName, children, ...props }: ScreenProps) {
  return (
    <ScrollView
      className="bg-background flex-1"
      contentContainerClassName={cn("px-4 pb-10 pt-2", contentClassName)}
      {...props}
    >
      <View className="mb-6">
        <Text className="text-foreground text-2xl font-bold">
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-muted-foreground mt-1 text-sm">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {children}
    </ScrollView>
  );
}

export function Surface({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn("bg-card border-border rounded-xl border p-4", className)} {...props} />;
}
