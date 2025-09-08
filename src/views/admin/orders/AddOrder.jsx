import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Input,
  Text,
  useColorModeValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  useToast,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { IoMdArrowBack, IoIosArrowDown, IoIosRemove } from 'react-icons/io';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useContext } from 'react';
import { LanguageContext } from '../../../components/auth/LanguageContext';
import { useCreateOrderMutation } from 'api/orderSlice';
import { useGetProductsQuery } from 'api/productSlice';
import { useGetUsersQuery } from 'api/userSlice';
import { useGetPromocodesQuery } from 'api/promocodeSlice';

const AddOrder = () => {
  const [userId, setUserId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [orderItems, setOrderItems] = useState([{ productId: '', quantity: '', discount: '', searchTerm: '' }]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [promoCodeId, setPromoCodeId] = useState('');
  const [selectedPromoCode, setSelectedPromoCode] = useState(null);
  const [promocodeSearchTerm, setPromocodeSearchTerm] = useState('');
  const [calculatedTotal, setCalculatedTotal] = useState(0);
  const [address, setAddress] = useState('');




  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();
  const { language } = useContext(LanguageContext);

  // API hooks
  const [createOrder, { isLoading: isCreatingOrder }] = useCreateOrderMutation();
  const { data: productsResponse, isLoading: isProductsLoading } = useGetProductsQuery({
    page: 1,
    limit: 1000,
    pharmacyId: JSON.parse(localStorage.getItem('pharmacy'))?.id
  });
  const { data: usersResponse, isLoading: isUsersLoading } = useGetUsersQuery({
    page: 1,
    limit: 1000
  });
  const { data: promoCodesResponse, isLoading: isPromoCodesLoading } = useGetPromocodesQuery({
    page: 1,
    limit: 1000
  });

  const cardBg = useColorModeValue('white', 'navy.700');
  const inputBg = useColorModeValue('gray.100', 'gray.700');
  const textColor = useColorModeValue('secondaryGray.900', 'white');

  // Get products, users, and promocodes from API response
  const products = productsResponse?.data || [];
  const users = usersResponse?.data || [];
  const promoCodes = promoCodesResponse?.data || [];
  
  // Debug: Log API data
  useEffect(() => {
    if (productsResponse) {
      console.log('Products Response:', productsResponse);
      console.log('Products Array:', products);
    }
    if (usersResponse) {
      console.log('Users Response:', usersResponse);
      console.log('Users Array:', users);
    }
    if (promoCodesResponse) {
      console.log('PromoCodes Response:', promoCodesResponse);
      console.log('PromoCodes Array:', promoCodes);
    }
  }, [productsResponse, products, usersResponse, users, promoCodesResponse, promoCodes]);

  const handleCancel = () => {
    setUserId('');
    setPaymentMethod('');
    setOrderDate('');
    setOrderItems([{ productId: '', quantity: '', discount: '', searchTerm: '' }]);
    setSelectedUser(null);
    setCustomerSearchTerm('');
    setPromoCodeId('');
    setSelectedPromoCode(null);
    setPromocodeSearchTerm('');
    setCalculatedTotal(0);
    setAddress('');
  };

  const handleSubmit = async () => {
    if (!userId || !paymentMethod || !orderDate || !address || orderItems.some(item => !item.productId || item.quantity === '' || parseInt(item.quantity) <= 0)) {
      toast({
        title: t('addOrder.error'),
        description: t('addOrder.fillAllFields'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      // Prepare order data according to the API structure
      const orderData = {
        userId: userId,
        pharmacyId: JSON.parse(localStorage.getItem('pharmacy'))?.id,
        paymentMethod: paymentMethod,
        address: address,
        items: orderItems.map(item => {
          const itemData = {
            productId: item.productId,
            quantity: parseInt(item.quantity)
          };
          
          // Only add discount if it's provided and greater than 0
          if (item.discount && parseFloat(item.discount) > 0) {
            itemData.discount = parseFloat(item.discount);
          }
          
          // Add variantItemId if needed (you can add this field to the form later)
          // if (item.variantItemId) {
          //   itemData.variantItemId = item.variantItemId;
          // }
          
          return itemData;
        }),
        orderDate: orderDate
      };

      // Add promoCodeId if selected
      if (promoCodeId) {
        orderData.promoCodeId = promoCodeId;
      }

      console.log('Sending order data:', orderData);

      // Call the API
      const response = await createOrder(orderData).unwrap();

    toast({
      title: t('addOrder.success'),
      description: t('addOrder.orderAddedSuccessfully'),
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
      
    navigate('/admin/orders');
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: t('addOrder.error'),
        description: error.data?.message || error.message || t('addOrder.orderCreationFailed'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleAddItem = () => {
    setOrderItems([...orderItems, { productId: '', quantity: '', discount: '', searchTerm: '' }]);
  };

  const handleRemoveItem = (index) => {
    if (orderItems.length > 1) {
      const newItems = [...orderItems];
      newItems.splice(index, 1);
      setOrderItems(newItems);
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...orderItems];
    newItems[index][field] = value;
    if (field === 'productId') {
        newItems[index].searchTerm = '';
    }
    setOrderItems(newItems);
  };

  React.useEffect(() => {
    let total = 0;
    orderItems.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product && item.quantity > 0) {
        const itemPrice = parseFloat(product.price) || 0;
        const quantity = parseInt(item.quantity, 10);
        const discount = parseFloat(item.discount) || 0;
        
        const priceAfterDiscount = itemPrice * (1 - discount / 100);
        total += priceAfterDiscount * quantity;
      }
    });
    setCalculatedTotal(total.toFixed(2));
  }, [orderItems, products]);

  return (
    <div className="container add-admin-container w-100">
      <Box bg={cardBg} className="add-admin-card shadow p-4 w-100">
        <div className="mb-3 d-flex justify-content-between align-items-center">
          <Text
            color={textColor}
            fontSize="22px"
            fontWeight="700"
            mb="20px !important"
            lineHeight="100%"
          >
            {t('addOrder.addNewOrder')}
          </Text>
          <Button
            type="button"
            onClick={() => navigate(-1)}
            colorScheme="teal"
            size="sm"
            leftIcon={<IoMdArrowBack />}
          >
            {t('addOrder.back')}
          </Button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          {/* Date */}
          <div className="mb-3">
            <FormControl isRequired>
              <FormLabel color={textColor} fontSize="sm" fontWeight="700">{t('addOrder.date')}</FormLabel>
              <Input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                required
                mt="8px"
                bg={inputBg}
                name="orderDate"
              />
            </FormControl>
          </div>

          {/* Customer */}
          <div className="mb-3">
            <FormControl isRequired>
              <FormLabel color={textColor} fontSize="sm" fontWeight="700">
                {t('addOrder.customer')}
                {isUsersLoading && <Text as="span" fontSize="sm" color="gray.500" ml={2}>({t('addOrder.loadingUsers')})</Text>}
              </FormLabel>
              <Menu>
                <MenuButton
                  as={Button}
                  rightIcon={<IoIosArrowDown />}
                  width="100%"
                  bg={inputBg}
                  border="1px solid #ddd"
                  borderRadius="md"
                  _hover={{ bg: 'gray.200' }}
                  textAlign="left"
                  fontSize="sm"
                  name="userId"
                >
                  {selectedUser ? selectedUser.name : t('addOrder.selectCustomer')}
                </MenuButton>
                <MenuList maxH="300px" overflowY="auto">
                  <Box px={3} py={2}>
                    <Input
                      placeholder={t('addOrder.searchCustomers')}
                      value={customerSearchTerm}
                      onChange={(e) => setCustomerSearchTerm(e.target.value)}
                      size="sm"
                      required={false}
                      name="customerSearch"
                    />
                  </Box>
                  {users
                    .filter(user =>
                      user.name && user.name.toLowerCase().includes(customerSearchTerm.toLowerCase())
                    )
                    .map(user => (
                      <MenuItem
                        key={user.id}
                        onClick={() => {
                          setUserId(user.id);
                          setSelectedUser(user);
                        }}
                      >
                        {user.name}
                      </MenuItem>
                    ))}
                </MenuList>
              </Menu>
            </FormControl>
          </div>

          {/* Address */}
          <div className="mb-3">
            <FormControl isRequired>
              <FormLabel color={textColor} fontSize="sm" fontWeight="700">{t('addOrder.address')}</FormLabel>
              <Input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                mt="8px"
                bg={inputBg}
                name="address"
                placeholder={t('addOrder.enterAddress')}
              />
            </FormControl>
          </div>

          {/* Payment */}
          <div className="mb-3">
            <FormControl isRequired>
              <FormLabel color={textColor} fontSize="sm" fontWeight="700">{t('addOrder.paymentMethod')}</FormLabel>
              <Menu>
                <MenuButton
                  as={Button}
                  rightIcon={<IoIosArrowDown />}
                  width="100%"
                  bg={inputBg}
                  border="1px solid #ddd"
                  borderRadius="md"
                  _hover={{ bg: 'gray.200' }}
                  textAlign="left"
                  fontSize="sm"
                  name="paymentMethod"
                >
                  {paymentMethod || t('addOrder.selectPaymentMethod')}
                </MenuButton>
                <MenuList>
                  <MenuItem onClick={() => setPaymentMethod('CASH_ON_DELIVERY')}>{t('addOrder.cashOnDelivery')}</MenuItem>
                  <MenuItem onClick={() => setPaymentMethod('CARD')}>{t('addOrder.card')}</MenuItem>
                  <MenuItem onClick={() => setPaymentMethod('ONLINE')}>{t('addOrder.onlinePayment')}</MenuItem>
                </MenuList>
              </Menu>
            </FormControl>
          </div>

          {/* Promo Code */}
          <div className="mb-3">
            <FormControl>
              <FormLabel color={textColor} fontSize="sm" fontWeight="700">
                {t('addOrder.promoCode')}
                {isPromoCodesLoading && <Text as="span" fontSize="sm" color="gray.500" ml={2}>({t('addOrder.loadingPromoCodes')})</Text>}
              </FormLabel>
              <Menu>
                <MenuButton
                  as={Button}
                  rightIcon={<IoIosArrowDown />}
                  width="100%"
                  bg={inputBg}
                  border="1px solid #ddd"
                  borderRadius="md"
                  _hover={{ bg: 'gray.200' }}
                  textAlign="left"
                  fontSize="sm"
                >
                  {selectedPromoCode ? selectedPromoCode.code : t('addOrder.selectPromoCode')}
                </MenuButton>
                <MenuList maxH="300px" overflowY="auto">
                  <MenuItem onClick={() => { setPromoCodeId(''); setSelectedPromoCode(null); }}>
                    {t('addOrder.none')}
                  </MenuItem>
                  <Box px={3} py={2}>
                    <Input
                      placeholder={t('addOrder.searchPromoCodes')}
                      value={promocodeSearchTerm}
                      onChange={(e) => setPromocodeSearchTerm(e.target.value)}
                      size="sm"
                    />
                  </Box>
                  {promoCodes
                    .filter(promo =>
                      promo.code && promo.code.toLowerCase().includes(promocodeSearchTerm.toLowerCase())
                    )
                    .map(promo => (
                      <MenuItem
                        key={promo.id}
                        onClick={() => {
                          setPromoCodeId(promo.id);
                          setSelectedPromoCode(promo);
                        }}
                      >
                        {promo.code} - {promo.value}{promo.type === 'PERCENTAGE' ? '%' : ''}
                      </MenuItem>
                    ))}
                  {promoCodes.length === 0 && !isPromoCodesLoading && (
                    <MenuItem isDisabled>
                      {t('addOrder.noPromoCodesFound')}
                    </MenuItem>
                  )}
                </MenuList>
              </Menu>
            </FormControl>
          </div>

          {/* Calculated Total */}
          <div className="mb-3">
            <FormControl>
              <FormLabel color={textColor} fontSize="sm" fontWeight="700">{t('addOrder.calculatedTotal')}</FormLabel>
              <Input
                type="text"
                value={calculatedTotal}
                isReadOnly
                mt="8px"
                bg={inputBg}
              />
            </FormControl>
          </div>

          {/* Order Items Table */}
          <Box mb={4}>
            <Text color={textColor} fontSize="md" fontWeight="700" mb={2}>
              {t('addOrder.orderItems')} <span className="text-danger mx-1">*</span>
              {isProductsLoading && <Text as="span" fontSize="sm" color="gray.500" ml={2}>({t('addOrder.loadingProducts')})</Text>}
            </Text>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th color="gray.400">{t('addOrder.product')}</Th>
                  <Th color="gray.400">{t('addOrder.quantity')}</Th>
                  <Th color="gray.400">{t('addOrder.discount')}</Th>
                  <Th color="gray.400">{t('addOrder.actions')}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {orderItems.map((item, index) => (
                  <Tr key={index}>
                    <Td>
                      <FormControl isRequired>
                        <Menu>
                          <MenuButton
                            as={Button}
                            rightIcon={<IoIosArrowDown />}
                            width="100%"
                            bg={inputBg}
                            border="1px solid #ddd"
                            borderRadius="md"
                            _hover={{ bg: 'gray.200' }}
                            textAlign="left"
                            fontSize="sm"
                            name="productId"
                          >
                            {products.find(p => p.id === item.productId)?.name || t('addOrder.selectProduct')}
                          </MenuButton>
                          <MenuList maxH="300px" overflowY="auto">
                            <Box px={3} py={2}>
                              <Input
                                placeholder={t('addOrder.searchProducts')}
                                value={item.searchTerm}
                                onChange={(e) => handleItemChange(index, 'searchTerm', e.target.value)}
                                size="sm"
                                required={false}
                                name="productSearch"
                              />
                            </Box>
                            {products
                              .filter(product => {
                                const matches = product.name && product.name.toLowerCase().includes(item.searchTerm.toLowerCase());
                                console.log('Product filter:', { productName: product.name, searchTerm: item.searchTerm, matches });
                                return matches;
                              })
                              .map(product => (
                                <MenuItem
                                  key={product.id}
                                  onClick={() => handleItemChange(index, 'productId', product.id)}
                                  name="productId"
                                >
                                  {product.name}
                                </MenuItem>
                              ))}
                          </MenuList>
                        </Menu>
                      </FormControl>
                    </Td>
                    <Td>
                      <FormControl isRequired>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          min={1}
                          bg={inputBg}
                          name="quantity"
                        />
                      </FormControl>
                    </Td>
                    <Td>
                      <FormControl>
                        <Input
                          type="number"
                          value={item.discount}
                          onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                          min={0}
                          max={100}
                          bg={inputBg}
                          name="discount"
                        />
                      </FormControl>
                    </Td>
                    <Td>
                      <IconButton
                        icon={<IoIosRemove />}
                        aria-label={t('addOrder.removeItem')}
                        colorScheme="red"
                        onClick={() => handleRemoveItem(index)}
                        isDisabled={orderItems.length === 1}
                      />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            <Button
              mt={2}
              onClick={handleAddItem}
              size="sm"
              variant={"darkBrand"}
            >
              {t('addOrder.addItem')}
            </Button>
          </Box>

          {/* Buttons */}
          <Flex justify="center" mt={4}>
            <Button
              variant="outline"
              colorScheme="red"
              onClick={handleCancel}
              mr={2}
            >
              {t('addOrder.reset')}
            </Button>
            <Button
              type="submit"
              variant={"darkBrand"}
              isLoading={isCreatingOrder}
              loadingText={t('addOrder.creating')}
              isDisabled={isCreatingOrder}
            >
              {t('addOrder.createOrder')}
            </Button>
          </Flex>
        </form>
      </Box>
    </div>
  );
};

export default AddOrder;
