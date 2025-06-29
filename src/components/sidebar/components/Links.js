/* eslint-disable */
import React, { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
// chakra imports
import {
  Box,
  Flex,
  HStack,
  Text,
  useColorModeValue,
  Collapse,
  Icon,
} from "@chakra-ui/react";
import DropdownMenu from "./DropdownMenu ";
import { useTranslation } from 'react-i18next';

export function SidebarLinks(props) {
  // Chakra color mode
  let location = useLocation();
  const navigate = useNavigate(); // Hook for navigation
  const { t } = useTranslation();

  // Change colors as per your preference
  let activeColor = useColorModeValue("#fffffff", "#F7FAFC"); // Active route color (light/dark mode)
  let inactiveColor = useColorModeValue("#A0AEC0", "#E2E8F0"); // Inactive route color (light/dark mode)
  let activeIcon = useColorModeValue("#ffffff", "#F7FAFC"); // Active icon color (light/dark mode)
  let textColor = useColorModeValue("#a9b6e3", "#a9b6e3"); // Text color (light/dark mode)
  let brandColor = useColorModeValue("#3182CE", "#2B6CB0"); // Brand color (light/dark mode)

  const { routes } = props;

  // verifies if routeName is the one active (in browser input)
  const activeRoute = (routeName) => {
    return routeName && location.pathname.includes(routeName);
  };

  // Handle logout
  const handleLogout = () => {
    // Clear user session or token (example: remove token from localStorage)
    localStorage.removeItem("token"); // Adjust this based on your authentication logic

    // Redirect to the login page
    navigate("/admin/auth/sign-in"); // Adjust the path to your login route
  };

  // DropdownMenu component for subRoutes
  <DropdownMenu route={routes} />;

  // this function creates the links from the secondary accordions (for example auth -> sign-in -> default)
  const createLinks = (routes) => {
    return routes.map((route, index) => {
      if (route.category) {
        return (
          <React.Fragment key={index}>
            <Text
              fontSize={"md"}
              color={activeColor}
              fontWeight="bold"
              mx="auto"
              ps={{
                sm: "10px",
                xl: "16px",
              }}
              pt="18px"
              pb="12px"
            >
              {route.name.startsWith('sidebar.') ? t(route.name) : route.name}
            </Text>
            {createLinks(route.items)}
          </React.Fragment>
        );
      } else if (route.subRoutes) {
        return <DropdownMenu key={index} route={route} />;
      } else if (
        route.layout === "/admin" ||
        route.layout === "/auth" ||
        route.layout === "/rtl"
      ) {
        // Handle logout route separately
        if (route.path === "/logout") {
          return (
            <Box
              key={index}
              onClick={handleLogout}
              cursor="pointer"
            >
              <HStack spacing="26px" py="5px" ps="10px">
                <Flex w="100%" alignItems="center" justifyContent="center">
                  <Box color={textColor} me="18px">
                    {route.icon}
                  </Box>
                  <Text me="auto" color={textColor} fontWeight="normal">
                    {route.name.startsWith('sidebar.') ? t(route.name) : route.name}
                  </Text>
                </Flex>
                <Box h="36px" w="4px" bg="transparent" borderRadius="5px" />
              </HStack>
            </Box>
          );
        }

        return (
          <NavLink key={index} to={route.layout + route.path}>
            {route.icon ? (
              <Box>
                <HStack
                  spacing={
                    activeRoute(route.path?.toLowerCase()) ? "22px" : "26px"
                  }
                  py="5px"
                  ps="10px"
                >
                  <Flex w="100%" alignItems="center" justifyContent="center">
                    <Box
                      color={
                        activeRoute(route.path?.toLowerCase())
                          ? activeIcon
                          : textColor
                      }
                      me="18px"
                    >
                      {route.icon}
                    </Box>
                    <Text
                      me="auto"
                      color={
                        activeRoute(route.path?.toLowerCase())
                          ? activeColor
                          : textColor
                      }
                      fontWeight={
                        activeRoute(route.path?.toLowerCase()) ? "bold" : "normal"
                      }
                    >
                      {route.name.startsWith('sidebar.') ? t(route.name) : route.name}
                    </Text>
                  </Flex>
                  <Box
                    h="36px"
                    w="4px"
                    bg={
                      activeRoute(route.path?.toLowerCase())
                        ? brandColor
                        : "transparent"
                    }
                    borderRadius="5px"
                  />
                </HStack>
              </Box>
            ) : (
              <Box>
                <HStack
                  spacing={
                    activeRoute(route.path?.toLowerCase()) ? "22px" : "26px"
                  }
                  py="5px"
                  ps="10px"
                >
                  <Text
                    me="auto"
                    color={
                      activeRoute(route.path?.toLowerCase())
                        ? activeColor
                        : inactiveColor
                    }
                    fontWeight={
                      activeRoute(route.path?.toLowerCase()) ? "bold" : "normal"
                    }
                  >
                    {route.name.startsWith('sidebar.') ? t(route.name) : route.name}
                  </Text>
                  <Box h="36px" w="4px" bg="brand.400" borderRadius="5px" />
                </HStack>
              </Box>
            )}
          </NavLink>
        );
      }
      return null;
    });
  };

  // BRAND
  return createLinks(routes);
}

export default SidebarLinks;