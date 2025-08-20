import React, { useState } from 'react';
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

  // Static mock data
  const users = [
    { id: '1', name: 'John Doe' },
    { id: '2', name: 'Jane Smith' },
    { id: '3', name: 'Mike Johnson' },
    { id: '4', name: 'Sarah Wilson' },
    { id: '5', name: 'David Brown' },
  ];

  const products = [
    { id: '1', name: 'Product A', price: 25.99 },
    { id: '2', name: 'Product B', price: 15.50 },
    { id: '3', name: 'Product C', price: 45.00 },
    { id: '4', name: 'Product D', price: 30.25 },
    { id: '5', name: 'Product E', price: 12.75 },
  ];

  const promocodes = [
    { id: '1', code: 'SAVE10', value: 10, type: 'PERCENTAGE' },
    { id: '2', code: 'SAVE20', value: 20, type: 'PERCENTAGE' },
    { id: '3', code: 'FIXED5', value: 5, type: 'FIXED' },
    { id: '4', code: 'FIXED10', value: 10, type: 'FIXED' },
  ];

  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();
  const { language } = useContext(LanguageContext);

  const cardBg = useColorModeValue('white', 'navy.700');
  const inputBg = useColorModeValue('gray.100', 'gray.700');
  const textColor = useColorModeValue('secondaryGray.900', 'white');

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
  };

  const handleSubmit = async () => {
    if (!userId || !paymentMethod || !orderDate || orderItems.some(item => !item.productId || item.quantity === '' || parseInt(item.quantity) <= 0)) {
      toast({
        title: t('addOrder.error'),
        description: t('addOrder.fillAllFields'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Mock success response
    toast({
      title: t('addOrder.success'),
      description: t('addOrder.orderAddedSuccessfully'),
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
    navigate('/admin/orders');
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
              <FormLabel color={textColor} fontSize="sm" fontWeight="700">{t('addOrder.customer')}</FormLabel>
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
              <FormLabel color={textColor} fontSize="sm" fontWeight="700">{t('addOrder.promoCode')}</FormLabel>
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
                  {promocodes
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
            <Text color={textColor} fontSize="md" fontWeight="700" mb={2}>{t('addOrder.orderItems')} <span className="text-danger mx-1">*</span></Text>
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
                              .filter(product =>
                                product.name && product.name.toLowerCase().includes(item.searchTerm.toLowerCase())
                              )
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
