import React, { useState } from 'react';
import {
  Grid,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Switch,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useAddPromocodeMutation } from 'api/promocodeSlice';
import Swal from 'sweetalert2';
import { IoMdArrowBack } from 'react-icons/io';
import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n';

const AddPromoCode = () => {
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const cardBg = useColorModeValue('white', 'gray.700');
  const inputBg = useColorModeValue('gray.100', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');
  const inputTextColor = useColorModeValue(undefined, 'white');
  const hoverBg = useColorModeValue('gray.200', 'gray.600');
  const selectedBg = useColorModeValue('blue.100', 'blue.600');
  const navigate = useNavigate();
  const [addPromocode, { isLoading }] = useAddPromocodeMutation();
  const { t } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    amount: '',
    type: 'FIXED', // Default to FIXED
    endDate: '',
    maxUsage: '',
    isActive: true,
  });

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle type selection
  const handleSelectType = (type) => {
    setFormData((prev) => ({
      ...prev,
      type: type.toUpperCase(),
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Format the end date to include time
    const formattedEndDate = formData.endDate
      ? `${formData.endDate}T23:59:59.999Z`
      : '';

    try {
      const response = await addPromocode({
        ...formData,
        amount: Number(formData.amount),
        maxUsage: Number(formData.maxUsage),
        endDate: formattedEndDate,
        pharmacyId: JSON.parse(localStorage.getItem("pharmacy")).id,
      }).unwrap();

      Swal.fire('Success!', 'Promo code created successfully.', 'success');
      navigate('/admin/promo-codes');
    } catch (error) {
      console.error('Failed to add promo code:', error);
      Swal.fire(
        'Error!',
        error.data?.message || 'Failed to create promo code.',
        'error',
      );
    }
  };

  return (
    <div className="container add-promo-container w-100 " dir={isRTL ? 'rtl' : 'ltr'}>
      <div
        className="add-promo-card shadow p-4 w-100"
        style={{ borderRadius: '15px', backgroundColor: cardBg, borderColor: borderColor, borderWidth: '1px' }}
      >
        <div className="mb-3 d-flex justify-content-between align-items-center">
          <Text color={textColor} fontSize="22px" fontWeight="700">
            {t('promocode.addNewPromoCode')}
          </Text>
          <Button
            type="button"
            onClick={() => navigate(-1)}
            colorScheme="teal"
            size="sm"
            leftIcon={<IoMdArrowBack />}
          >
            {t('promocode.back')}
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <Grid templateColumns="repeat(2, 1fr)" gap={6}>
            {/* Promo Code Field */}
            <FormControl>
              <FormLabel color={textColor} fontSize="sm" fontWeight="700">
                {t('promocode.promoCode')}
                <span className="text-danger mx-1">*</span>
              </FormLabel>
              <Input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder={t('promocode.enterPromoCode')}
                required
                mt={'8px'}
                bg={inputBg}
                color={inputTextColor}
              />
            </FormControl>

            {/* Amount Field */}
            <FormControl>
              <FormLabel color={textColor} fontSize="sm" fontWeight="700">
                {t('promocode.amount')}
                <span className="text-danger mx-1">*</span>
              </FormLabel>
              <Input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder={t('promocode.enterAmount')}
                required
                mt={'8px'}
                bg={inputBg}
                color={inputTextColor}
              />
            </FormControl>

            {/* Type Dropdown */}
            <FormControl>
              <FormLabel color={textColor} fontSize="sm" fontWeight="700">
                {t('promocode.type')}
                <span className="text-danger mx-1">*</span>
              </FormLabel>
              <Menu>
                <MenuButton
                  as={Button}
                  rightIcon={<ChevronDownIcon />}
                  width="100%"
                  bg={inputBg}
                  color={inputTextColor}
                  border={`1px solid ${borderColor}`}
                  borderRadius="md"
                  _hover={{ bg: hoverBg }}
                  textAlign="left"
                  mt={'8px'}
                >
                  {formData.type === 'FIXED' ? 'Fixed Amount' : 'Percentage'}
                </MenuButton>
                <MenuList width="100%" bg={inputBg}>
                  <MenuItem
                    onClick={() => handleSelectType('FIXED')}
                    bg={formData.type === 'FIXED' ? selectedBg : inputBg}
                    color={inputTextColor}
                  >
                    Fixed Amount
                  </MenuItem>
                  <MenuItem
                    onClick={() => handleSelectType('PERCENTAGE')}
                    bg={formData.type === 'PERCENTAGE' ? selectedBg : inputBg}
                    color={inputTextColor}
                  >
                    Percentage
                  </MenuItem>
                </MenuList>
              </Menu>
            </FormControl>

            {/* Status Switch */}
          

            {/* End Date Field */}
            <FormControl>
              <FormLabel color={textColor} fontSize="sm" fontWeight="700">
                {t('promocode.endDate')}
                <span className="text-danger mx-1">*</span>
              </FormLabel>
              <Input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                required
                mt={'8px'}
                min={new Date().toISOString().split('T')[0]}
                bg={inputBg}
                color={inputTextColor}
              />
            </FormControl>

            {/* Max Usage Field */}
            <FormControl>
              <FormLabel color={textColor} fontSize="sm" fontWeight="700">
                {t('promocode.maxUsage')}
                <span className="text-danger mx-1">*</span>
              </FormLabel>
              <Input
                type="number"
                name="maxUsage"
                value={formData.maxUsage}
                onChange={handleInputChange}
                placeholder={t('promocode.enterMaximumUsage')}
                required
                mt={'8px'}
                min="1"
                bg={inputBg}
                color={inputTextColor}
              />
            </FormControl>
            {/* <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="is-active" mb="0" mt="30px">
                Active Status
              </FormLabel>
              <Switch
                id="is-active"
                isChecked={formData.isActive}
                onChange={() =>
                  setFormData((prev) => ({
                    ...prev,
                    isActive: !prev.isActive,
                  }))
                }
                colorScheme="green"
                mt={'8px'}
              />
            </FormControl> */}
          </Grid>

          {/* Submit Button */}
          <Flex justify="center" mt={8}>
            <Button
              variant="outline"
              colorScheme="red"
              mr={2}
              ml={2}
              onClick={() => navigate(-1)}
            >
              {t('promocode.cancel')}
            </Button>
            <Button
              variant="darkBrand"
              color="white"
              fontSize="sm"
              fontWeight="500"
              borderRadius="70px"
              px="24px"
              py="5px"
              type="submit"
              isLoading={isLoading}
              loadingText={t('promocode.submitting')}
            >
              {t('promocode.createPromoCode')}
            </Button>
          </Flex>
        </form>
      </div>
    </div>
  );
};

export default AddPromoCode;
