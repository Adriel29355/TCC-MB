import { Ionicons } from "@expo/vector-icons";
import { Href, router, usePathname } from "expo-router";
import { PropsWithChildren } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useAppContext } from "@/contexts/AppContext";

type NavItem = {
  href: Href;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const navItems: NavItem[] = [
  { href: "/", label: "Inicio", icon: "home-outline" },
  { href: "/agenda", label: "Agenda", icon: "calendar-outline" },
  { href: "/adicionar", label: "Adicionar", icon: "add-circle-outline" },
  { href: "/historico", label: "Historico", icon: "time-outline" },
  { href: "/configuracoes", label: "Config", icon: "settings-outline" },
  { href: "/ajuda", label: "Ajuda", icon: "help-circle-outline" },
];

export function PharmaScreen({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const isAuthScreen = pathname === "/login" || pathname === "/cadastro";
  const { darkMode, largeText } = useAppContext();

  const bg = darkMode ? "#0F1923" : "#F8FCFF";
  const cardBg = darkMode ? "#1A2736" : "#FFFFFF";
  const borderColor = darkMode ? "#2A3F55" : "#D8ECFF";
  const navBg = darkMode ? "#1A2736" : "#FFFFFF";

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          isAuthScreen && styles.authContent,
        ]}
      >
        {children}
      </ScrollView>
      {!isAuthScreen ? (
        <View style={[styles.nav, { backgroundColor: navBg, borderColor }]}>
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Pressable
                key={String(item.href)}
                onPress={() => router.push(item.href)}
                style={[styles.navItem, active && styles.navItemActive]}
              >
                <View style={styles.navInner}>
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={
                      active ? "#2F80ED" : darkMode ? "#8AAFC8" : "#6D8AA4"
                    }
                  />
                  <Text
                    style={[
                      styles.navText,
                      active && styles.navTextActive,
                      darkMode && styles.navTextDark,
                      largeText && styles.navTextLarge,
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  const { darkMode, largeText } = useAppContext();
  return (
    <View style={styles.header}>
      {eyebrow ? (
        <Text style={[styles.eyebrow, darkMode && styles.eyebrowDark]}>
          {eyebrow}
        </Text>
      ) : null}
      <Text
        style={[
          styles.title,
          darkMode && styles.titleDark,
          largeText && styles.titleLarge,
        ]}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={[
            styles.subtitle,
            darkMode && styles.subtitleDark,
            largeText && styles.subtitleLarge,
          ]}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

export function Card({ children }: PropsWithChildren) {
  const { darkMode } = useAppContext();
  return (
    <View style={[styles.card, darkMode && styles.cardDark]}>{children}</View>
  );
}

export function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  const { darkMode, largeText } = useAppContext();
  return (
    <View style={[styles.statCard, darkMode && styles.statCardDark]}>
      <Text style={[styles.statValue, largeText && styles.statValueLarge]}>
        {value}
      </Text>
      <Text
        style={[
          styles.statLabel,
          darkMode && styles.statLabelDark,
          largeText && styles.statLabelLarge,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export const pharmaStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  list: {
    gap: 12,
  },
  cardTitle: {
    color: "#14324A",
    fontSize: 18,
    fontWeight: "800",
  },
  body: {
    color: "#5F7F9B",
    fontSize: 15,
    lineHeight: 22,
  },
  small: {
    color: "#6D8AA4",
    fontSize: 13,
  },
  pill: {
    alignSelf: "flex-start",
    borderRadius: 8,
    backgroundColor: "#EAF6FF",
    color: "#2F80ED",
    fontSize: 13,
    fontWeight: "800",
    paddingHorizontal: 10,
    paddingVertical: 5,
    overflow: "hidden",
  },
  primaryButton: {
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#2F80ED",
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  secondaryButton: {
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#B8DEFF",
    borderRadius: 8,
    backgroundColor: "#F8FCFF",
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  secondaryButtonText: {
    color: "#2F80ED",
    fontSize: 15,
    fontWeight: "800",
  },
  input: {
    borderWidth: 1,
    borderColor: "#CFE7FF",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    color: "#14324A",
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FCFF",
  },
  content: {
    alignSelf: "center",
    flexGrow: 1,
    width: "100%",
    maxWidth: 980,
    gap: 18,
    padding: 20,
    paddingBottom: 112,
  },
  authContent: {
    justifyContent: "center",
    maxWidth: 520,
    paddingBottom: 20,
  },
  header: {
    gap: 8,
    paddingTop: 24,
    paddingBottom: 10,
  },
  eyebrow: {
    alignSelf: "flex-start",
    borderRadius: 8,
    backgroundColor: "#EAF6FF",
    color: "#2F80ED",
    fontSize: 13,
    fontWeight: "800",
    paddingHorizontal: 10,
    paddingVertical: 6,
    overflow: "hidden",
  },
  eyebrowDark: {
    backgroundColor: "#1A3A5C",
  },
  title: {
    color: "#14324A",
    fontSize: 32,
    fontWeight: "900",
    lineHeight: 38,
  },
  titleDark: {
    color: "#E8F4FF",
  },
  titleLarge: {
    fontSize: 40,
    lineHeight: 48,
  },
  subtitle: {
    color: "#5F7F9B",
    fontSize: 16,
    lineHeight: 23,
  },
  subtitleDark: {
    color: "#8AAFC8",
  },
  subtitleLarge: {
    fontSize: 20,
    lineHeight: 28,
  },
  card: {
    borderWidth: 1,
    borderColor: "#D8ECFF",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    gap: 12,
    padding: 16,
  },
  cardDark: {
    borderColor: "#2A3F55",
    backgroundColor: "#1A2736",
  },
  statCard: {
    flex: 1,
    minWidth: 92,
    borderWidth: 1,
    borderColor: "#D8ECFF",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    padding: 14,
  },
  statCardDark: {
    borderColor: "#2A3F55",
    backgroundColor: "#1A2736",
  },
  statValue: {
    color: "#2F80ED",
    fontSize: 24,
    fontWeight: "900",
  },
  statValueLarge: {
    fontSize: 30,
  },
  statLabel: {
    color: "#5F7F9B",
    fontSize: 12,
    fontWeight: "700",
  },
  statLabelDark: {
    color: "#8AAFC8",
  },
  statLabelLarge: {
    fontSize: 15,
  },
  nav: {
    position: "absolute",
    alignSelf: "center",
    right: 12,
    bottom: 12,
    left: 12,
    maxWidth: 980,
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#D8ECFF",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    padding: 6,
  },
  navItem: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
  },
  navItemActive: {
    backgroundColor: "#EAF6FF",
  },
  navInner: {
    alignItems: "center",
    gap: 3,
  },
  navText: {
    color: "#6D8AA4",
    fontSize: 10,
    fontWeight: "800",
  },
  navTextActive: {
    color: "#2F80ED",
  },
  navTextDark: {
    color: "#8AAFC8",
  },
  navTextLarge: {
    fontSize: 13,
  },
});
