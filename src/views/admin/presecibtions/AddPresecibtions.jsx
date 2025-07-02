import React, { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Flex,
  Text,
  useColorModeValue,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useToast,
  Image,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from "@chakra-ui/react";
import { IoMdArrowBack } from "react-icons/io";
import { useNavigate, useParams } from "react-router-dom";
import { useGetProductsQuery } from "api/productSlice";
import { useAddPrescriptionToCartMutation } from "api/prescription";
import { useTranslation } from 'react-i18next';

const AddPrescription = () => {
  const { id: prescriptionId } = useParams();
  const toast = useToast();
  const navigate = useNavigate();
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const cardBg = useColorModeValue('white', 'gray.700');
  const inputBg = useColorModeValue('gray.100', 'gray.700');
  const inputTextColor = useColorModeValue(undefined, 'white');
  const tableBg = useColorModeValue('white', 'gray.700');
  const tableRowHover = useColorModeValue('gray.50', 'gray.600');
  const { t } = useTranslation();
  
  // Fetch pharmacy products
  const { data: productsResponse, isLoading } = useGetProductsQuery({ 
    page: 1, 
    limit: 100,
    pharmacyId: JSON.parse(localStorage.getItem('pharmacy')).id 
  });

  const [addToCart] = useAddPrescriptionToCartMutation();
  const [selectedProducts, setSelectedProducts] = useState([]);

  const handleSelectProduct = (productId, isChecked) => {
    setSelectedProducts(prev => isChecked
      ? [...prev, { productId, quantity: 1 }]
      : prev.filter(item => item.productId !== productId)
    );
  };

  const handleQuantityChange = (productId, value) => {
    const quantity = Math.max(1, parseInt(value) || 1);
    setSelectedProducts(prev => 
      prev.map(item => item.productId === productId ? { ...item, quantity } : item)
    );
  };

  const handleAddToCart = async () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "No products selected",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await addToCart({
        id: prescriptionId,
        products: selectedProducts.map(({ productId, quantity }) => ({
          productId,
          quantity
        }))
      }).unwrap();

      toast({
        title: "Added to cart",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      navigate(-1);
    } catch (error) {
      toast({
        title: "Error adding to cart",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box bg={inputBg} className="container add-prescription-container w-100">
      <Box className="add-prescription-card shadow p-4 w-100" style={{ backgroundColor: cardBg, borderColor: borderColor, borderWidth: '1px' }}>
        <div className="mb-3 d-flex justify-content-between align-items-center">
          <Text color={textColor} fontSize="22px" fontWeight="700">
            {t('prescriptions.addPrescriptionToCart')}
          </Text>
          <Button
            type="button"
            onClick={() => navigate(-1)}
            colorScheme="teal"
            size="sm"
            leftIcon={<IoMdArrowBack />}
          >
            {t('prescriptions.back')}
          </Button>
        </div>

        {isLoading ? (
          <Text>{t('prescriptions.loadingProducts')}</Text>
        ) : (
          <>
            <Text fontSize="lg" fontWeight="600" mb={4}>
              {t('prescriptions.selectProductsToAdd')}
            </Text>

            <Box overflowX="auto">
              <Table variant="simple" color="gray.500" mb="24px" mt="12px" bg={tableBg}>
                <Thead>
                  <Tr bg={tableBg}>
                    <Th pe="10px" borderColor={borderColor}>{t('prescriptions.select')}</Th>
                    <Th pe="10px" borderColor={borderColor}>{t('prescriptions.product')}</Th>
                    <Th pe="10px" borderColor={borderColor}>{t('prescriptions.image')}</Th>
                    <Th pe="10px" borderColor={borderColor}>{t('prescriptions.price')}</Th>
                    <Th pe="10px" borderColor={borderColor}>{t('prescriptions.available')}</Th>
                    <Th pe="10px" borderColor={borderColor}>{t('prescriptions.quantity')}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {productsResponse?.data?.map(product => {
                    const isSelected = selectedProducts.some(p => p.productId === product.id);
                    const quantity = isSelected 
                      ? selectedProducts.find(p => p.productId === product.id).quantity
                      : 1;

                    return (
                      <Tr key={product.id} _hover={{ bg: tableRowHover }}>
                        <Td fontSize={{ sm: '14px' }} minW={{ sm: '150px', md: '200px', lg: 'auto' }} borderColor="transparent">
                          <Checkbox
                            isChecked={isSelected}
                            onChange={(e) => handleSelectProduct(product.id, e.target.checked)}
                            colorScheme="blue"
                          />
                        </Td>
                        <Td fontSize={{ sm: '14px' }} minW={{ sm: '150px', md: '200px', lg: 'auto' }} borderColor="transparent">
                          <Text color={textColor}>{product.name}</Text>
                        </Td>
                        <Td fontSize={{ sm: '14px' }} minW={{ sm: '150px', md: '200px', lg: 'auto' }} borderColor="transparent">
                          <Image
                            src={product.mainImage}
                            alt={product.name}
                            boxSize="50px"
                            objectFit="cover"
                            borderRadius="md"
                          />
                        </Td>
                        <Td fontSize={{ sm: '14px' }} minW={{ sm: '150px', md: '200px', lg: 'auto' }} borderColor="transparent">
                          <Text color={textColor}>{product.price} KWD</Text>
                        </Td>
                        <Td fontSize={{ sm: '14px' }} minW={{ sm: '150px', md: '200px', lg: 'auto' }} borderColor="transparent">
                          <Badge 
                            colorScheme={product.quantity > 0 ? "green" : "red"}
                            px={3}
                            py={1}
                            borderRadius="full"
                          >
                            {product.quantity}
                          </Badge>
                        </Td>
                        <Td fontSize={{ sm: '14px' }} minW={{ sm: '150px', md: '200px', lg: 'auto' }} borderColor="transparent">
                          {isSelected ? (
                            <NumberInput
                              min={1}
                              max={product.quantity}
                              value={quantity}
                              onChange={(value) => handleQuantityChange(product.id, value)}
                              width="100px"
                            >
                              <NumberInputField bg={inputBg} color={inputTextColor} />
                              <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                              </NumberInputStepper>
                            </NumberInput>
                          ) : (
                            <Text color="gray.400">-</Text>
                          )}
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </Box>

            <Flex justify="flex-end" mt={6}>
              <Button
                colorScheme="blue"
                fontSize="sm"
                fontWeight="500"
                borderRadius="70px"
                px="24px"
                py="5px"
                onClick={handleAddToCart}
                isDisabled={selectedProducts.length === 0}
              >
                {t('prescriptions.addSelectedToCart', { count: selectedProducts.length })}
              </Button>
            </Flex>
          </>
        )}
      </Box>
    </Box>
  );
};

export default AddPrescription;