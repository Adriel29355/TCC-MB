import { Ionicons } from "@expo/vector-icons";
import { Href, router, usePathname } from "expo-router";
import { PropsWithChildren } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

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

// Paleta dark refinada
const dark = {
  bg: "#0B1520",
  cardBg: "#111E2D",
  cardBorder: "#1E3448",
  navBg: "#111E2D",
  navBorder: "#1E3448",
  title: "#E8F4FF",
  subtitle: "#7FA8C8",
  cardTitle: "#C8E0F4",
  body: "#7FA8C8",
  small: "#5F86A6",
  eyebrowBg: "#0D2238",
  pillBg: "#0D2238",
  inputBg: "#0D2238",
  inputBorder: "#1E3448",
  inputText: "#C8E0F4",
  secondaryBtn: "#0D2238",
  secondaryBtnBorder: "#1E3448",
};

export function PharmaScreen({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const isAuthScreen =
    pathname === "/login" ||
    pathname === "/cadastro" ||
    pathname === "/termos-de-uso";
  const { darkMode } = useAppContext();

  return (
    <View
      style={[styles.root, { backgroundColor: darkMode ? dark.bg : "#F8FCFF" }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          isAuthScreen && styles.authContent,
        ]}
      >
        {children}
      </ScrollView>
      {!isAuthScreen ? (
        <View
          style={[
            styles.nav,
            darkMode && {
              backgroundColor: dark.navBg,
              borderColor: dark.navBorder,
            },
          ]}
        >
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Pressable
                key={String(item.href)}
                onPress={() => router.push(item.href)}
                style={[
                  styles.navItem,
                  active && [
                    styles.navItemActive,
                    darkMode && { backgroundColor: "#0D2238" },
                  ],
                ]}
              >
                <View style={styles.navInner}>
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={
                      active ? "#2F80ED" : darkMode ? "#5F86A6" : "#6D8AA4"
                    }
                  />
                  <Text
                    style={[
                      styles.navText,
                      active && styles.navTextActive,
                      darkMode && { color: "#5F86A6" },
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
        <Text
          style={[
            styles.eyebrow,
            darkMode && { backgroundColor: dark.eyebrowBg, color: "#4A9EE0" },
          ]}
        >
          {eyebrow}
        </Text>
      ) : null}
      <Text
        style={[
          styles.title,
          darkMode && { color: dark.title },
          largeText && styles.titleLarge,
        ]}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={[
            styles.subtitle,
            darkMode && { color: dark.subtitle },
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
    <View
      style={[
        styles.card,
        darkMode && {
          backgroundColor: dark.cardBg,
          borderColor: dark.cardBorder,
        },
      ]}
    >
      {children}
    </View>
  );
}

export function StatCard({
  label,
  value,
  icon,
  accentColor = "#2F80ED",
  iconBackground = "#EAF6FF",
}: {
  label: string;
  value: string | number;
  icon?: keyof typeof Ionicons.glyphMap;
  accentColor?: string;
  iconBackground?: string;
}) {
  const { darkMode, largeText } = useAppContext();
  return (
    <View
      style={[
        styles.statCard,
        darkMode && {
          backgroundColor: dark.cardBg,
          borderColor: dark.cardBorder,
        },
      ]}
    >
      {icon ? (
        <View style={[styles.statIcon, { backgroundColor: iconBackground }] }>
          <Ionicons name={icon} size={18} color={accentColor} />
        </View>
      ) : null}
      <Text
        style={[
          styles.statValue,
          { color: accentColor },
          largeText && styles.statValueLarge,
        ]}
      >
        {value}
      </Text>
      <Text
        style={[
          styles.statLabel,
          darkMode && { color: dark.body },
          largeText && styles.statLabelLarge,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

// Hook para estilos dinâmicos usados nas telas
export function usePharmaStyles() {
  const { darkMode, largeText } = useAppContext();

  return {
    cardTitle: {
      color: darkMode ? dark.cardTitle : "#14324A",
      fontSize: largeText ? 20 : 18,
      fontWeight: "800",
    } as TextStyle,
    body: {
      color: darkMode ? dark.body : "#5F7F9B",
      fontSize: largeText ? 17 : 15,
      lineHeight: 22,
    } as TextStyle,
    small: {
      color: darkMode ? dark.small : "#6D8AA4",
      fontSize: largeText ? 15 : 13,
    } as TextStyle,
    pill: {
      alignSelf: "flex-start",
      borderRadius: 8,
      backgroundColor: darkMode ? dark.pillBg : "#EAF6FF",
      color: "#2F80ED",
      fontSize: 13,
      fontWeight: "800",
      paddingHorizontal: 10,
      paddingVertical: 5,
      overflow: "hidden",
    } as TextStyle,
    input: {
      borderWidth: 1,
      borderColor: darkMode ? dark.inputBorder : "#CFE7FF",
      borderRadius: 8,
      backgroundColor: darkMode ? dark.inputBg : "#FFFFFF",
      color: darkMode ? dark.inputText : "#14324A",
      fontSize: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
    } as TextStyle,
    primaryButton: {
      alignItems: "center",
      borderRadius: 8,
      backgroundColor: "#2F80ED",
      paddingHorizontal: 16,
      paddingVertical: 13,
    } as ViewStyle,
    primaryButtonText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "800",
    } as TextStyle,
    secondaryButton: {
      alignItems: "center",
      borderWidth: 1,
      borderColor: darkMode ? dark.secondaryBtnBorder : "#B8DEFF",
      borderRadius: 8,
      backgroundColor: darkMode ? dark.secondaryBtn : "#F8FCFF",
      paddingHorizontal: 16,
      paddingVertical: 13,
    } as ViewStyle,
    secondaryButtonText: {
      color: "#2F80ED",
      fontSize: 15,
      fontWeight: "800",
    } as TextStyle,
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    } as ViewStyle,
    list: {
      gap: 12,
    } as ViewStyle,
  };
}

// Mantém pharmaStyles estático para compatibilidade com telas que ainda não usam o hook
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
  title: {
    color: "#14324A",
    fontSize: 32,
    fontWeight: "900",
    lineHeight: 38,
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
  subtitleLarge: {
    fontSize: 20,
    lineHeight: 28,
  },
  card: {
    borderWidth: 1,
    borderColor: "#D8ECFF",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    gap: 12,
    padding: 16,
  },
  statCard: {
    flex: 1,
    minWidth: 92,
    minHeight: 118,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D8ECFF",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    gap: 5,
    padding: 12,
  },
  statIcon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
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
    lineHeight: 16,
    textAlign: "center",
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
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    padding: 6,
  },
  navItem: {
    flex: 1,
    borderRadius: 10,
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
});
