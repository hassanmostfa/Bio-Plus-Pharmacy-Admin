import React from "react";
import {
  Box,
  SimpleGrid,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react";
import IconBox from "components/icons/IconBox";
import MiniStatistics from "components/card/MiniStatistics";
import {
  MdOutlineShoppingCart,
  MdAssignment,
} from "react-icons/md";
import CheckTable from "views/admin/default/components/CheckTable";
import { columnsDataCheck } from "views/admin/default/variables/columnsData";
import tableDataCheck from "views/admin/default/variables/tableDataCheck.json";

import { LuShoppingBasket } from "react-icons/lu";
import { useGetStatsQuery, useGetLowStockProductsQuery, useGetHighestSellingProductsQuery } from "api/pharmacySlice";
import { useTranslation } from "react-i18next";
import i18n from "../../../i18n";
import { 
  Table, 
  Thead, 
  Tbody, 
  Tr, 
  Th, 
  Td, 
  Text, 
  Image, 
  Badge,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Spinner,
  Box as ChakraBox
} from "@chakra-ui/react";

export default function UserReports() {
  const brandColor = useColorModeValue("brand.500", "white");
  const boxBg = useColorModeValue("secondaryGray.300", "whiteAlpha.100");
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  
  const { data: stats } = useGetStatsQuery();
  const { t } = useTranslation();
  
  // Get pharmacy ID from localStorage
  const pharmacyId = JSON.parse(localStorage.getItem('pharmacy'))?.id;
  
  // Fetch analytics data (only if pharmacyId exists)
  const { data: lowStockData, isLoading: isLowStockLoading, error: lowStockError } = useGetLowStockProductsQuery(pharmacyId, {
    skip: !pharmacyId
  });
  const { data: highestSellingData, isLoading: isHighestSellingLoading, error: highestSellingError } = useGetHighestSellingProductsQuery(pharmacyId, {
    skip: !pharmacyId
  });
  
  const lowStockProducts = lowStockData?.data || [];
  const highestSellingProducts = highestSellingData?.data || [];
  
  const cardData = [
    { name: t("dashboard.totalOrders"), value: stats?.data?.totalOrders || 0, icon: MdOutlineShoppingCart },
    { name: t("dashboard.totalProducts"), value: stats?.data?.totalProducts || 0, icon: LuShoppingBasket },
    { name: t("dashboard.totalPrescriptions"), value: stats?.data?.totalPrescriptions || 0, icon: MdAssignment },
  ];

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }} dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Updated Cards Section */}
      <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap="20px" mb="20px">
        {cardData.map((card, index) => (
          <MiniStatistics
            key={index}
            startContent={
              <IconBox
                w="56px"
                h="56px"
                bg={boxBg}
                icon={<Icon w="32px" h="32px" as={card.icon} color={brandColor} />}
              />
            }
            name={card.name}
            value={card.value}
          />
        ))}
      </SimpleGrid>

      {/* Analytics Tables */}
      <SimpleGrid columns={{ base: 1, xl: 2 }} gap="20px" mb="20px">
        {/* Low Stock Products */}
        <Card>
          <CardHeader>
            <Heading size="md" color={textColor}>
              {t('dashboard.lowStockProducts')}
            </Heading>
          </CardHeader>
          <CardBody>
            {isLowStockLoading ? (
              <ChakraBox display="flex" justifyContent="center" p={4}>
                <Spinner size="lg" />
              </ChakraBox>
            ) : (
              <Table variant="simple" color="gray.500" mb="24px" mt="12px">
                <Thead>
                  <Tr>
                    <Th borderColor={borderColor} color="gray.400">Product</Th>
                    <Th borderColor={borderColor} color="gray.400">SKU</Th>
                    <Th borderColor={borderColor} color="gray.400">Price</Th>
                    <Th borderColor={borderColor} color="gray.400">Stock</Th>
                    <Th borderColor={borderColor} color="gray.400">Category</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {lowStockProducts.length === 0 ? (
                    <Tr>
                      <Td colSpan={5} textAlign="center" color="gray.500">
                        {t('dashboard.noLowStockProducts')}
                      </Td>
                    </Tr>
                  ) : (
                    lowStockProducts.map((product) => (
                      <Tr key={product.id}>
                        <Td borderColor="transparent">
                          <Box display="flex" alignItems="center">
                            {product.mainImageKey && (
                              <Image
                                src={product.mainImageKey}
                                alt={product.name}
                                boxSize="40px"
                                borderRadius="md"
                                mr={3}
                              />
                            )}
                            <Text color={textColor} fontWeight="500">
                              {product.name}
                            </Text>
                          </Box>
                        </Td>
                        <Td borderColor="transparent">
                          <Text color={textColor}>{product.sku}</Text>
                        </Td>
                        <Td borderColor="transparent">
                          <Text color={textColor}>KWD {product.price}</Text>
                        </Td>
                        <Td borderColor="transparent">
                          <Badge 
                            colorScheme={product.quantity <= 5 ? "red" : product.quantity <= 10 ? "orange" : "green"}
                            variant="subtle"
                          >
                            {product.quantity}
                          </Badge>
                        </Td>
                        <Td borderColor="transparent">
                          <Text color={textColor}>
                            {product.category?.translations?.find(t => t.languageId === 'en')?.name || product.category?.name || 'N/A'}
                          </Text>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            )}
          </CardBody>
        </Card>

        {/* Highest Selling Products */}
        <Card>
          <CardHeader>
            <Heading size="md" color={textColor}>
              {t('dashboard.highestSellingProducts')}
            </Heading>
          </CardHeader>
          <CardBody>
            {isHighestSellingLoading ? (
              <ChakraBox display="flex" justifyContent="center" p={4}>
                <Spinner size="lg" />
              </ChakraBox>
            ) : (
              <Table variant="simple" color="gray.500" mb="24px" mt="12px">
                <Thead>
                  <Tr>
                    <Th borderColor={borderColor} color="gray.400">Product</Th>
                    <Th borderColor={borderColor} color="gray.400">Price</Th>
                    <Th borderColor={borderColor} color="gray.400">{t('dashboard.sold')}</Th>
                    <Th borderColor={borderColor} color="gray.400">{t('dashboard.revenue')}</Th>
                    <Th borderColor={borderColor} color="gray.400">Brand</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {highestSellingProducts.length === 0 ? (
                    <Tr>
                      <Td colSpan={5} textAlign="center" color="gray.500" py={8}>
                        <Box>
                          <Text fontSize="sm" mb={2}>
                            {t('dashboard.noHighestSellingProducts')}
                          </Text>
                          <Text fontSize="xs" color="gray.400">
                            {t('dashboard.noSalesDataYet')}
                          </Text>
                        </Box>
                      </Td>
                    </Tr>
                  ) : (
                    highestSellingProducts.map((product) => (
                      <Tr key={product.id}>
                        <Td borderColor="transparent">
                          <Box display="flex" alignItems="center">
                            {product.mainImageKey && (
                              <Image
                                src={product.mainImageKey}
                                alt={product.name}
                                boxSize="40px"
                                borderRadius="md"
                                mr={3}
                              />
                            )}
                            <Text color={textColor} fontWeight="500">
                              {product.name}
                            </Text>
                          </Box>
                        </Td>
                        <Td borderColor="transparent">
                          <Text color={textColor}>KWD {product.basePrice}</Text>
                        </Td>
                        <Td borderColor="transparent">
                          <Badge colorScheme="blue" variant="subtle">
                            {product.totalSold}
                          </Badge>
                        </Td>
                        <Td borderColor="transparent">
                          <Badge colorScheme="green" variant="subtle">
                            KWD {product.totalRevenue}
                          </Badge>
                        </Td>
                        <Td borderColor="transparent">
                          <Text color={textColor}>
                            {product.brandName || 'N/A'}
                          </Text>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      </SimpleGrid>
    
    </Box>
  );
}
