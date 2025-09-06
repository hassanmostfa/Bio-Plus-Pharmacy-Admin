import React, { useState } from 'react';
import {
  Box,
  Image,
  Badge,
  Button,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Text,
  useColorModeValue,
  Icon,
  Select,
  Textarea,
  Switch,
  SimpleGrid,
  Radio,
  RadioGroup,
  Stack,
  Card,
  CardHeader,
  CardBody,
  IconButton,
  useToast,
  FormControl,
  FormLabel,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuOptionGroup,
  MenuItemOption,
} from '@chakra-ui/react';
import { FaUpload, FaTrash, FaArrowUp, FaArrowDown } from 'react-icons/fa6';
import { FaSearch } from 'react-icons/fa';
import { IoMdArrowBack } from 'react-icons/io';
import { useNavigate } from 'react-router-dom';
import { useGetVarientsQuery } from 'api/varientSlice';
import { useGetCategoriesQuery } from 'api/categorySlice';
import { useGetBrandsQuery } from 'api/brandSlice';
import { useAddProductMutation } from 'api/productSlice';
import Swal from 'sweetalert2';
import { useAddFileMutation } from 'api/filesSlice';
import { useGetTypesQuery } from 'api/typeSlice';
import { useTranslation } from "react-i18next";
import i18n from "../../../i18n";
import { ChevronDownIcon } from '@chakra-ui/icons';

// Custom SearchableSelect Component
const SearchableSelect = ({ 
  placeholder, 
  value, 
  onChange, 
  options, 
  bg, 
  color, 
  searchValue, 
  onSearchChange,
  getOptionLabel,
  getOptionValue 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState('');

  const handleSearchChange = (e) => {
    const searchTerm = e.target.value;
    setLocalSearch(searchTerm);
    onSearchChange(searchTerm);
  };

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
    setLocalSearch('');
    onSearchChange('');
  };

  const selectedOption = options.find(option => getOptionValue(option) === value);
  const displayValue = selectedOption ? getOptionLabel(selectedOption) : '';

  return (
    <Menu isOpen={isOpen} onClose={() => setIsOpen(false)}>
      <MenuButton
        as={Button}
        rightIcon={<ChevronDownIcon />}
        w="100%"
        justifyContent="space-between"
        bg={bg}
        color={color}
        border="1px solid"
        borderColor="gray.300"
        _hover={{ borderColor: "gray.400" }}
        _active={{ borderColor: "blue.500" }}
        textAlign="left"
        fontWeight="normal"
        onClick={() => setIsOpen(true)}
      >
        {displayValue || placeholder}
      </MenuButton>
      <MenuList maxH="200px" overflowY="auto">
        <Box p={2}>
          <InputGroup size="sm">
            <InputLeftElement pointerEvents="none">
              <FaSearch color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search..."
              value={localSearch}
              onChange={handleSearchChange}
              onClick={(e) => e.stopPropagation()}
            />
          </InputGroup>
        </Box>
        {options.length === 0 ? (
          <MenuItem isDisabled>No options found</MenuItem>
        ) : (
          options.map((option) => (
            <MenuItem
              key={getOptionValue(option)}
              onClick={() => handleSelect(getOptionValue(option))}
            >
              {getOptionLabel(option)}
            </MenuItem>
          ))
        )}
      </MenuList>
    </Menu>
  );
};

const AddProduct = () => {
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [productTypeId, setProductTypeId] = useState(''); // New state for product type
  const [cost, setCost] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [offerType, setOfferType] = useState('');
  const [offerPercentage, setOfferPercentage] = useState(null);
  const [hasVariants, setHasVariants] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const [images, setImages] = useState([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [selectedAttributes, setSelectedAttributes] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  // New states for additional fields
  const [sku, setSku] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [howToUseEn, setHowToUseEn] = useState('');
  const [howToUseAr, setHowToUseAr] = useState('');
  const [treatmentEn, setTreatmentEn] = useState('');
  const [treatmentAr, setTreatmentAr] = useState('');
  const [ingredientsEn, setIngredientsEn] = useState('');
  const [ingredientsAr, setIngredientsAr] = useState('');

  // New states for discount
  const [discount, setDiscount] = useState(null);
  const [discountType, setDiscountType] = useState(null);

  const [addProduct, { isLoading }] = useAddProductMutation();
  const toast = useToast();
  const navigate = useNavigate();

  // Search terms for server-side search in selects
  const [categorySearch, setCategorySearch] = useState('');
  const [brandSearch, setBrandSearch] = useState('');
  const [typeSearch, setTypeSearch] = useState('');
  const [categoryDebouncedSearch, setCategoryDebouncedSearch] = useState('');
  const [brandDebouncedSearch, setBrandDebouncedSearch] = useState('');
  const [typeDebouncedSearch, setTypeDebouncedSearch] = useState('');

  React.useEffect(() => {
    const id = setTimeout(() => setCategoryDebouncedSearch(categorySearch), 500);
    return () => clearTimeout(id);
  }, [categorySearch]);

  React.useEffect(() => {
    const id = setTimeout(() => setBrandDebouncedSearch(brandSearch), 500);
    return () => clearTimeout(id);
  }, [brandSearch]);

  React.useEffect(() => {
    const id = setTimeout(() => setTypeDebouncedSearch(typeSearch), 500);
    return () => clearTimeout(id);
  }, [typeSearch]);

  // Fetch data
  const { data: categoriesResponse } = useGetCategoriesQuery({
    page: 1,
    limit: categoryDebouncedSearch ? 20 : 1000,
    search: categoryDebouncedSearch || undefined,
  });
  const { data: variantsResponse } = useGetVarientsQuery({
    page: 1,
    limit: 1000,
  });
  const { data: brandsResponse } = useGetBrandsQuery({ 
    page: 1, 
    limit: brandDebouncedSearch ? 20 : 1000, 
    search: brandDebouncedSearch || undefined,
    name: brandDebouncedSearch || undefined // Try both search and name parameters
  });
  const { data: productTypesResponse } = useGetTypesQuery({ page: 1, limit: typeDebouncedSearch ? 20 : 1000, search: typeDebouncedSearch || undefined }); // Fetch product types
  
  const categories = categoriesResponse?.data?.data || [];
  const variants = variantsResponse?.data || [];
  const brands = brandsResponse?.data?.data || brandsResponse?.data || [];
  
  // Debug: Log brands response to help identify the issue
  React.useEffect(() => {
    if (brandsResponse) {
      console.log('Brands Response:', brandsResponse);
      console.log('Brands Data:', brands);
    }
  }, [brandsResponse, brands]);
  const productTypes = productTypesResponse?.data?.items || []; // Get product types from response
  
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');
  const uploadBg = useColorModeValue('gray.100', 'gray.700');
  const uploadDragBg = useColorModeValue('blue.50', 'brand.900');
  const inputBg = useColorModeValue('gray.100', 'gray.700');
  const inputTextColor = useColorModeValue(undefined, 'white');
  const [addFile] = useAddFileMutation();

  const { t } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // Image handling
  const handleImageUpload = (files) => {
    if (files && files.length > 0) {
      const newImages = Array.from(files)
        .map((file) => {
          if (!file.type.startsWith('image/')) {
            toast({
              title: 'Error',
              description: 'Please upload only image files',
              status: 'error',
              duration: 5000,
              isClosable: true,
            });
            return null;
          }
          return {
            file,
            preview: URL.createObjectURL(file),
            id: Date.now() + Math.random(), // Unique ID for each image
          };
        })
        .filter((img) => img !== null);

      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      
      // Always set the first image (order 1) as main image
        setMainImageIndex(0);
      }
  };

  const handleRemoveImage = (imageId) => {
    const imageToRemove = images.find(img => img.id === imageId);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    const newImages = images.filter(img => img.id !== imageId);
    setImages(newImages);
    
    // Always set the first image (order 1) as main image after removal
    if (newImages.length > 0) {
      setMainImageIndex(0);
    } else {
      setMainImageIndex(0);
    }
  };

  const handleSetMainImage = (imageId) => {
    const index = images.findIndex(img => img.id === imageId);
    if (index !== -1) {
      // Move the selected image to first position and set as main
      const newImages = [...images];
      const selectedImage = newImages.splice(index, 1)[0];
      newImages.unshift(selectedImage);
    setImages(newImages);
      setMainImageIndex(0);
    }
  };

  // Reorder images
  const moveImage = (imageId, direction) => {
    const currentIndex = images.findIndex(img => img.id === imageId);
    if (currentIndex === -1) return;

    const newImages = [...images];
    let newIndex;

    if (direction === 'up' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === 'down' && currentIndex < newImages.length - 1) {
      newIndex = currentIndex + 1;
    } else {
      return; // Can't move in that direction
    }

    // Swap images
    [newImages[currentIndex], newImages[newIndex]] = [newImages[newIndex], newImages[currentIndex]];
    
    setImages(newImages);
    
    // Always set the first image (order 1) as main image after reordering
    setMainImageIndex(0);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleImageUpload(e.dataTransfer.files);
  };

  // Variant handling
  const handleVariantSelect = (e) => {
    const variantId = e.target.value;
    const selectedVariant = variants.find((v) => v.id === variantId);

    if (selectedVariant) {
      const newAttributes = selectedVariant.attributes.map((attr) => ({
        variantId: selectedVariant.id,
        variantName: selectedVariant.name,
        attributeId: attr.id,
        attributeValue: attr.value,
        cost: '',
        price: '',
        quantity: '',
        image: null,
        isActive: true,
        lotNumber: '',
        expiryDate: '',
      }));
      setSelectedAttributes([...selectedAttributes, ...newAttributes]);
    }
  };

  const handleAttributeChange = (index, field, value) => {
    const updatedAttributes = [...selectedAttributes];
    updatedAttributes[index][field] = value;
    setSelectedAttributes(updatedAttributes);
  };

  const handleDeleteAttribute = (index) => {
    setSelectedAttributes(selectedAttributes.filter((_, i) => i !== index));
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Upload product images first
      const uploadedImages = [];
      if (images.length > 0) {
        const imageUploadPromises = images.map(async (img, index) => {
          const formData = new FormData();
          formData.append('file', img.file);

          const uploadResponse = await addFile(formData).unwrap();

          if (
            uploadResponse.success &&
            uploadResponse.data.uploadedFiles.length > 0
          ) {
            return {
              imageKey: uploadResponse.data.uploadedFiles[0].url,
              order: index,
              isMain: index === mainImageIndex,
            };
          }
          return null;
        });

        const results = await Promise.all(imageUploadPromises);
        uploadedImages.push(...results.filter((img) => img !== null));
      }

      // Prepare translations
      const translations = [];
      if (nameAr || descriptionAr || howToUseAr || treatmentAr || ingredientsAr) {
        translations.push({
          languageId: 'ar',
          name: nameAr,
          description: descriptionAr,
          howToUse: howToUseAr,
          treatment: treatmentAr,
          ingredient: ingredientsAr
        });
      }
  
      // Prepare product data
      if (!price) {
        throw new Error(t('forms.priceRequired'));
      }

      // Validate variants if hasVariants is true
      if (hasVariants && selectedAttributes.length === 0) {
        throw new Error('Please add at least one variant when hasVariants is enabled');
      }

      // Validate variant fields if hasVariants is true
      if (hasVariants && selectedAttributes.length > 0) {
        for (let i = 0; i < selectedAttributes.length; i++) {
          const attr = selectedAttributes[i];
          if (!attr.price || parseFloat(attr.price) <= 0) {
            throw new Error(`Price is required for variant ${i + 1}`);
          }
          if (!attr.cost || parseFloat(attr.cost) <= 0) {
            throw new Error(`Cost is required for variant ${i + 1}`);
          }
          if (!attr.quantity || parseInt(attr.quantity) <= 0) {
            throw new Error(`Quantity is required for variant ${i + 1}`);
          }
        }
      }

      // Prepare variants data if hasVariants is true
      let variantsData = undefined;
      if (hasVariants && selectedAttributes.length > 0) {
        // Upload variant images first
        const variantUploadPromises = selectedAttributes.map(async (attr) => {
          let imageKey = undefined;
          if (attr.image && attr.image instanceof File) {
            const formData = new FormData();
            formData.append('file', attr.image);
            
            try {
              const uploadResponse = await addFile(formData).unwrap();
              if (uploadResponse.success && uploadResponse.data.uploadedFiles.length > 0) {
                imageKey = uploadResponse.data.uploadedFiles[0].url;
              }
            } catch (error) {
              console.error('Failed to upload variant image:', error);
            }
          }
          
        return {
          variantId: attr.variantId,
          attributeId: attr.attributeId,
            cost: parseFloat(attr.cost) || 0,
            price: parseFloat(attr.price) || 0,
            quantity: parseInt(attr.quantity) || 0,
            imageKey: imageKey || attr.imageKey || undefined,
          isActive: attr.isActive,
            expiryDate: attr.expiryDate || undefined,
        };
      });

        variantsData = await Promise.all(variantUploadPromises);
      }
  
      const productData = {
        name: nameEn,
        description: descriptionEn,
        howToUse: howToUseEn,
        treatment: treatmentEn,
        ingredient: ingredientsEn,
        categoryId: categoryId,
        brandId: brandId,
        pharmacyId: JSON.parse(localStorage.getItem('pharmacy'))?.id,
        productTypeId: productTypeId,
        sku: sku,
        cost: cost ? parseFloat(cost) : undefined,
        price: parseFloat(price),
        quantity: quantity ? parseInt(quantity) : undefined,
        discount: discount != null ? parseFloat(discount) : undefined,
        discountType: discountType,
        lotNumber: lotNumber,
        expiryDate: expiryDate,
        hasVariants,
        isActive,
        isPublished,
        translations: translations,
        images: uploadedImages,
        variants: variantsData
      };
  
      // Only include offerType and offerPercentage if offerType is not "NONE"
      if (offerType && offerType !== "NONE") {
        productData.offerType = offerType;
        productData.offerPercentage = offerPercentage != null ? parseFloat(offerPercentage) : undefined;
      }
  
      // Remove any keys that are null or undefined
      Object.keys(productData).forEach((key) => {
        if (productData[key] == null || productData[key] === undefined) {
          delete productData[key];
        }
      });

      // Submit to API
      const response = await addProduct(productData).unwrap();

      toast({
        title: t('common.success'),
        description: t('product.productCreatedSuccess'),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      navigate('/admin/products');
    } catch (err) {
      toast({
        title: t('common.error'),
        description:
          err.data?.message || err.message || t('forms.failedToCreateProduct'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleCancel = () => {
    Swal.fire({
      title: t('common.areYouSure'),
      text: t('forms.loseUnsavedChanges'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: t('common.yesDiscardChanges'),
    }).then((result) => {
      if (result.isConfirmed) {
        navigate('/admin/products');
      }
    });
  };

  return (
    <Box bg={inputBg} className="container add-admin-container w-100" dir={isRTL ? 'rtl' : 'ltr'}>
      <Box bg={inputBg} className="add-admin-card shadow p-4 w-100">
        <Flex  className="mb-3 d-flex justify-content-between align-items-center">
          <Text
            color={textColor}
            fontSize="22px"
            fontWeight="700"
            mb="20px !important"
            lineHeight="100%"
          >
            {t('productForm.addNewProduct')}
          </Text>
          <Button
            type="button"
            onClick={handleCancel}
            colorScheme="teal"
            size="sm"
            leftIcon={<IoMdArrowBack />}
          >
            {t('productForm.back')}
          </Button>
        </Flex>
        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
            <Box>
              <FormControl isRequired>
                <FormLabel>{t('productForm.productNameEn')}</FormLabel>
                <Input
                  placeholder={t('productForm.enterProductName')}
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  bg={inputBg}
                  color={inputTextColor}
                />
              </FormControl>
            </Box>
            <Box>
              <FormControl>
                <FormLabel>{t('productForm.productNameAr')}</FormLabel>
                <Input
                  placeholder={t('productForm.enterProductNameAr')}
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  dir="rtl"
                  bg={inputBg}
                  color={inputTextColor}
                />
              </FormControl>
            </Box>
          </SimpleGrid>

          {/* Description Sections */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
            <Box>
              <FormControl isRequired>
                <FormLabel>{t('productForm.descriptionEn')}</FormLabel>
                <Textarea
                  placeholder={t('productForm.enterDescription')}
                  value={descriptionEn}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                  bg={inputBg}
                  color={inputTextColor}
                  maxLength={500}
                />
                <Text fontSize="sm" color="gray.500" mt={1}>
                  {descriptionEn.length}/500 {t('common.characters')}
                </Text>
              </FormControl>
            </Box>
            <Box>
              <FormControl>
                <FormLabel>{t('productForm.descriptionAr')}</FormLabel>
                <Textarea
                  placeholder={t('productForm.enterDescriptionAr')}
                  value={descriptionAr}
                  onChange={(e) => setDescriptionAr(e.target.value)}
                  dir="rtl"
                  bg={inputBg}
                  color={inputTextColor}
                  maxLength={500}
                />
                <Text fontSize="sm" color="gray.500" mt={1}>
                  {descriptionAr.length}/500 {t('common.characters')}
                </Text>
              </FormControl>
            </Box>

            {/* How To Use */}
            <Box>
              <FormControl>
                <FormLabel>{t('productForm.howToUseEn')}</FormLabel>
                <Textarea
                  placeholder={t('productForm.enterHowToUse')}
                  value={howToUseEn}
                  onChange={(e) => setHowToUseEn(e.target.value)}
                  bg={inputBg}
                  color={inputTextColor}
                  maxLength={500}
                />
                <Text fontSize="sm" color="gray.500" mt={1}>
                  {howToUseEn.length}/500 {t('common.characters')}
                </Text>
              </FormControl>
            </Box>
            <Box>
              <FormControl>
                <FormLabel>{t('productForm.howToUseAr')}</FormLabel>
                <Textarea
                  placeholder={t('productForm.enterHowToUseAr')}
                  value={howToUseAr}
                  onChange={(e) => setHowToUseAr(e.target.value)}
                  dir="rtl"
                  bg={inputBg}
                  color={inputTextColor}
                  maxLength={500}
                />
                <Text fontSize="sm" color="gray.500" mt={1}>
                  {howToUseAr.length}/500 {t('common.characters')}
                </Text>
              </FormControl>
            </Box>

            {/* Treatment */}
            <Box>
              <FormControl>
                <FormLabel>{t('productForm.treatmentEn')}</FormLabel>
                <Textarea
                  placeholder={t('productForm.enterTreatmentInformation')}
                  value={treatmentEn}
                  onChange={(e) => setTreatmentEn(e.target.value)}
                  bg={inputBg}
                  color={inputTextColor}
                  maxLength={500}
                />
                <Text fontSize="sm" color="gray.500" mt={1}>
                  {treatmentEn.length}/500 {t('common.characters')}
                </Text>
              </FormControl>
            </Box>
            <Box>
              <FormControl>
                <FormLabel>{t('productForm.treatmentAr')}</FormLabel>
                <Textarea
                  placeholder={t('productForm.enterTreatmentAr')}
                  value={treatmentAr}
                  onChange={(e) => setTreatmentAr(e.target.value)}
                  dir="rtl"
                  bg={inputBg}
                  color={inputTextColor}
                  maxLength={500}
                />
                <Text fontSize="sm" color="gray.500" mt={1}>
                  {treatmentAr.length}/500 {t('common.characters')}
                </Text>
              </FormControl>
            </Box>

            {/* Ingredients */}
            <Box>
              <FormControl>
                <FormLabel>{t('productForm.ingredientsEn')}</FormLabel>
                <Textarea
                  placeholder={t('productForm.enterIngredients')}
                  value={ingredientsEn}
                  onChange={(e) => setIngredientsEn(e.target.value)}
                  bg={inputBg}
                  color={inputTextColor}
                  maxLength={500}
                />
                <Text fontSize="sm" color="gray.500" mt={1}>
                  {ingredientsEn.length}/500 {t('common.characters')}
                </Text>
              </FormControl>
            </Box>
            <Box>
              <FormControl>
                <FormLabel>{t('productForm.ingredientsAr')}</FormLabel>
                <Textarea
                  placeholder={t('productForm.enterIngredientsAr')}
                  value={ingredientsAr}
                  onChange={(e) => setIngredientsAr(e.target.value)}
                  dir="rtl"
                  bg={inputBg}
                  color={inputTextColor}
                  maxLength={500}
                />
                <Text fontSize="sm" color="gray.500" mt={1}>
                  {ingredientsAr.length}/500 {t('common.characters')}
                </Text>
              </FormControl>
            </Box>
          </SimpleGrid>

          {/* SKU, Lot Number, Expiry Date (only if no variants) */}
          {!hasVariants && (
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
              <Box>
                <FormControl>
                  <FormLabel>{t('productForm.sku')}</FormLabel>
                  <Input
                    type="text"
                    placeholder={t('productForm.enterSku')}
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    bg={inputBg}
                    color={inputTextColor}
                  />
                </FormControl>
              </Box>
              <Box>
                <FormControl>
                  <FormLabel>{t('productForm.lotNumber')}</FormLabel>
                  <Input
                    type="text"
                    placeholder={t('productForm.enterLotNumber')}
                    value={lotNumber}
                    onChange={(e) => setLotNumber(e.target.value)}
                    bg={inputBg}
                    color={inputTextColor}
                  />
                </FormControl>
              </Box>
              <Box>
                <FormControl>
                  <FormLabel>{t('productForm.expiryDate')}</FormLabel>
                  <Input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    bg={inputBg}
                    color={inputTextColor}
                  />
                </FormControl>
              </Box>
            </SimpleGrid>
          )}

          {/* Category, Brand and Product Type */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
            <Box>
              <FormControl isRequired>
                <FormLabel>{t('productForm.category')}</FormLabel>
                <SearchableSelect
                  placeholder={t('productForm.selectCategory')}
                  value={categoryId}
                  onChange={(value) => setCategoryId(value)}
                  options={categories}
                  bg={inputBg}
                  color={inputTextColor}
                  searchValue={categorySearch}
                  onSearchChange={setCategorySearch}
                  getOptionLabel={(cat) => cat.translations?.find((t) => t.languageId === 'en')?.name || cat.name}
                  getOptionValue={(cat) => cat.id}
                />
              </FormControl>
            </Box>
            <Box>
              <FormControl isRequired>
                <FormLabel>{t('productForm.brand')}</FormLabel>
                <SearchableSelect
                  placeholder={t('productForm.selectBrand')}
                  value={brandId}
                  onChange={(value) => setBrandId(value)}
                  options={brands}
                  bg={inputBg}
                  color={inputTextColor}
                  searchValue={brandSearch}
                  onSearchChange={setBrandSearch}
                  getOptionLabel={(brand) => brand.name}
                  getOptionValue={(brand) => brand.id}
                />
              </FormControl>
            </Box>
            <Box>
              <FormControl>
                <FormLabel>{t('productForm.productType')}</FormLabel>
                <SearchableSelect
                  placeholder={t('productForm.selectProductType')}
                  value={productTypeId}
                  onChange={(value) => setProductTypeId(value)}
                  options={productTypes}
                  bg={inputBg}
                  color={inputTextColor}
                  searchValue={typeSearch}
                  onSearchChange={setTypeSearch}
                  getOptionLabel={(type) => type.name}
                  getOptionValue={(type) => type.id}
                />
              </FormControl>
            </Box>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
            <Box>
              <FormControl isRequired>
                <FormLabel>{t('productForm.cost')}</FormLabel>
                <Input
                  type="number"
                  placeholder={t('productForm.enterCost')}
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  bg={inputBg}
                  color={inputTextColor}
                  min="0"
                  onKeyDown={(e) => {
                    if (e.key === '-') {
                      e.preventDefault();
                    }
                  }}
                />
              </FormControl>
            </Box>
            <Box>
              <FormControl isRequired>
                <FormLabel>{t('productForm.price')}</FormLabel>
                <Input
                  type="number"
                  placeholder={t('productForm.enterPrice')}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  bg={inputBg}
                  color={inputTextColor}
                  min="0"
                  onKeyDown={(e) => {
                    if (e.key === '-') {
                      e.preventDefault();
                    }
                  }}
                />
              </FormControl>
            </Box>
            <Box>
              <FormControl isRequired>
                <FormLabel>{t('productForm.quantity')}</FormLabel>
                <Input
                  type="number"
                  placeholder={t('productForm.enterQuantity')}
                  value={quantity}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 5) {
                      setQuantity(value);
                    }
                  }}
                  bg={inputBg}
                  color={inputTextColor}
                  min="0"
                  max="99999"
                  onKeyDown={(e) => {
                    if (e.key === '-') {
                      e.preventDefault();
                    }
                  }}
                />
              </FormControl>
            </Box>
          </SimpleGrid>

          {/* Offer Type */}
          <Box mb={4}>
            <FormLabel>{t('productForm.offerType')}</FormLabel>
            <RadioGroup value={offerType} onChange={setOfferType}>
              <Stack direction="row">
                <Radio value="MONTHLY_OFFER">{t('productForm.monthlyOffer')}</Radio>
                <Radio value="NEW_ARRIVAL">{t('productForm.newArrival')}</Radio>
                <Radio value="NONE">{t('productForm.none')}</Radio>
              </Stack>
            </RadioGroup>
            {offerType === 'MONTHLY_OFFER' && (
              <Box mt={2}>
                <FormControl>
                  <FormLabel>{t('productForm.offerPercentage')}</FormLabel>
                                  <Input
                  type="number"
                    placeholder={t('productForm.enterOfferPercentage')}
                  value={offerPercentage}
                  onChange={(e) => setOfferPercentage(e.target.value)}
                  bg={inputBg}
                  color={inputTextColor}
                />
                </FormControl>
              </Box>
            )}
          </Box>

          {/* Discount Fields (only if no variants) */}
          {!hasVariants && (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
              <Box>
                <FormControl>
                  <FormLabel>{t('productForm.discount')}</FormLabel>
                  <Input
                    type="number"
                    placeholder={t('productForm.enterDiscountValue')}
                    value={discount != null ? discount : ''}
                    onChange={(e) => setDiscount(e.target.value)}
                    bg={inputBg}
                    color={inputTextColor}
                    min="0"
                    onKeyDown={(e) => {
                      if (e.key === '-') {
                        e.preventDefault();
                      }
                    }}
                  />
                </FormControl>
              </Box>
              <Box>
                <FormControl>
                  <FormLabel>{t('productForm.discountType')}</FormLabel>
                  <Select
                    placeholder={t('productForm.selectDiscountType')}
                    value={discountType || ''}
                    onChange={(e) => setDiscountType(e.target.value)}
                    bg={inputBg}
                    color={inputTextColor}
                    style={{ direction: 'ltr' }}
                  >
                    <option value="PERCENTAGE">{t('productForm.percentage')}</option>
                    <option value="FIXED">{t('productForm.fixed')}</option>
                  </Select>
                </FormControl>
              </Box>
            </SimpleGrid>
          )}

          {/* Status Switches */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
          <FormControl display="flex" alignItems="center">
              <FormLabel mb="0">{t('productForm.isPublished')}</FormLabel>
              <Switch
                isChecked={isPublished}
                onChange={() => setIsPublished(!isPublished)}
                style={{ direction: 'ltr' }}
              />
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <FormLabel mb="0">{t('productForm.isActive')}</FormLabel>
              <Switch
                isChecked={isActive}
                onChange={() => setIsActive(!isActive)}
                style={{ direction: 'ltr' }}
              />
            </FormControl>
            
            <FormControl display="flex" alignItems="center">
              <FormLabel mb="0">{t('productForm.hasVariants')}</FormLabel>
              <Switch
                isChecked={hasVariants}
                onChange={() => setHasVariants(!hasVariants)}
                style={{ direction: 'ltr' }}
              />
            </FormControl>
          </SimpleGrid>

          {/* Variants Section */}
          {hasVariants && (
            <Box mb={4}>
              <FormControl mb={4}>
                <FormLabel>{t('productForm.selectVariant')}</FormLabel>
                <Select
                  placeholder={t('productForm.selectVariant')}
                  onChange={handleVariantSelect}
                  bg={inputBg}
                  color={inputTextColor}
                  style={{ direction: 'ltr' }}
                >
                  {variants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              {selectedAttributes.length > 0 && (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {selectedAttributes.map((attr, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <Flex justify="space-between" align="center">
                          <Text fontWeight="bold">
                            {attr.variantName} - {attr.attributeValue}
                          </Text>
                          <IconButton
                            icon={<FaTrash />}
                            aria-label={t('common.deleteVariant')}
                            size="sm"
                            colorScheme="red"
                            onClick={() => handleDeleteAttribute(index)}
                          />
                        </Flex>
                      </CardHeader>
                      <CardBody>
                        <SimpleGrid columns={2} spacing={2}>
                          <FormControl isRequired>
                            <FormLabel>{t('productForm.cost')}</FormLabel>
                            <Input
                              type="number"
                              value={attr.cost}
                              onChange={(e) =>
                                handleAttributeChange(
                                  index,
                                  'cost',
                                  e.target.value,
                                )
                              }
                              bg={inputBg}
                              color={inputTextColor}
                              min="0"
                              onKeyDown={(e) => {
                                if (e.key === '-') {
                                  e.preventDefault();
                                }
                              }}
                            />
                          </FormControl>
                          <FormControl isRequired>
                            <FormLabel>{t('productForm.price')}</FormLabel>
                            <Input
                              type="number"
                              value={attr.price}
                              onChange={(e) =>
                                handleAttributeChange(
                                  index,
                                  'price',
                                  e.target.value,
                                )
                              }
                              bg={inputBg}
                              color={inputTextColor}
                              min="0"
                              onKeyDown={(e) => {
                                if (e.key === '-') {
                                  e.preventDefault();
                                }
                              }}
                            />
                          </FormControl>
                          <FormControl isRequired>
                            <FormLabel>{t('productForm.quantity')}</FormLabel>
                            <Input
                              type="number"
                              value={attr.quantity}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value.length <= 5) {
                                handleAttributeChange(
                                  index,
                                  'quantity',
                                    value,
                                  );
                              }
                              }}
                              bg={inputBg}
                              color={inputTextColor}
                              min="0"
                              max="99999"
                              onKeyDown={(e) => {
                                if (e.key === '-') {
                                  e.preventDefault();
                                }
                              }}
                            />
                          </FormControl>
                          <FormControl>
                            <FormLabel>{t('productForm.variantImage')}</FormLabel>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  if (
                                    !e.target.files[0].type.startsWith('image/')
                                  ) {
                                    toast({
                                      title: t('common.error'),
                                      description: t('forms.imageOnlyError'),
                                      status: 'error',
                                      duration: 5000,
                                      isClosable: true,
                                    });
                                    return;
                                  }
                                  handleAttributeChange(
                                    index,
                                    'image',
                                    e.target.files[0],
                                  );
                                }
                              }}
                              bg={inputBg}
                              color={inputTextColor}
                            />
                            {attr.image && (
                              <Image
                                src={attr.image instanceof File ? URL.createObjectURL(attr.image) : attr.image}
                                alt={t('productForm.variantPreview')}
                                mt={2}
                                maxH="100px"
                              />
                            )}
                          </FormControl>

                          {/* Variant Expiry Date */}
                          <FormControl>
                            <FormLabel>{t('productForm.expiryDate')}</FormLabel>
                            <Input
                              type="date"
                              value={attr.expiryDate}
                              onChange={(e) =>
                                handleAttributeChange(
                                  index,
                                  'expiryDate',
                                  e.target.value,
                                )
                              }
                              bg={inputBg}
                              color={inputTextColor}
                            />
                          </FormControl>
                        </SimpleGrid>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
              )}
            </Box>
          )}

          {/* Product Images */}
          <Box mb={4}>
            <FormControl isRequired={images.length === 0}>
              <FormLabel>
                {t('productForm.productImages')}
                {images.length === 0 && <span style={{ color: 'red' }}>*</span>}
              </FormLabel>
              <Box
                border="1px dashed"
                borderColor={isDragging ? 'brand.500' : 'gray.300'}
                borderRadius="md"
                p={4}
                textAlign="center"
                backgroundColor={isDragging ? 'brand.50' : uploadBg}
                cursor="pointer"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                mb={4}
              >
                {images.length > 0 ? (
                  <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                {images.map((img, index) => (
                      <Box key={img.id} position="relative" display="flex" flexDirection="column" alignItems="center">
                    <Image
                      src={img.preview}
                          alt={t('productForm.productImage', { index: index + 1 })}
                      borderRadius="md"
                          maxH="150px"
                          border={mainImageIndex === index ? '2px solid' : '1px solid'}
                          borderColor={mainImageIndex === index ? 'brand.500' : 'gray.300'}
                      cursor="pointer"
                          onClick={() => handleSetMainImage(img.id)}
                    />
                    {mainImageIndex === index && (
                          <Badge position="absolute" top={2} left={2} colorScheme="brand">
                        {t('productForm.main')}
                      </Badge>
                    )}
                        
                        {/* Image Controls */}
                        <Flex position="absolute" top={2} right={2} gap={1}>
                    <IconButton
                      icon={<FaTrash />}
                            aria-label={t('common.removeImage')}
                      size="sm"
                      colorScheme="red"
                            onClick={() => handleRemoveImage(img.id)}
                          />
                        </Flex>
                        
                        {/* Reorder Controls */}
                        <Flex position="absolute" bottom={2} right={2} gap={1}>
                          <IconButton
                            icon={<FaArrowUp />}
                            aria-label="Move up"
                            size="sm"
                            colorScheme="blue"
                            variant="solid"
                            isDisabled={index === 0}
                            onClick={() => moveImage(img.id, 'up')}
                          />
                          <IconButton
                            icon={<FaArrowDown />}
                            aria-label="Move down"
                            size="sm"
                            colorScheme="blue"
                            variant="solid"
                            isDisabled={index === images.length - 1}
                            onClick={() => moveImage(img.id, 'down')}
                          />
                        </Flex>
                        
                        {/* Image Order Badge */}
                        <Badge position="absolute" bottom={2} left={2} colorScheme="gray">
                          {index + 1}
                        </Badge>
                  </Box>
                ))}
              </SimpleGrid>
                ) : (
                  <>
                    <Icon as={FaUpload} w={8} h={8} color="#422afb" mb={2} />
                    <Text color="gray.500" mb={2}>
                      {t('productForm.dragDropImageHere')}
                    </Text>
                    <Text color="gray.500" mb={2}>
                      {t('productForm.or')}
                    </Text>
                    <Button
                      variant="outline"
                      color="#422afb"
                      border="none"
                      onClick={() => document.getElementById('file-upload').click()}
                    >
                      {t('productForm.uploadImage')}
                      <input
                        type="file"
                        id="file-upload"
                        hidden
                        accept="image/*"
                        multiple
                        onChange={(e) => handleImageUpload(e.target.files)}
                      />
                    </Button>
                  </>
            )}
          </Box>
            </FormControl>
          </Box>

          {/* Submit Buttons */}
          <Flex justify="flex-end" gap={4}>
            <Button 
              variant="outline" 
              colorScheme="red" 
              onClick={handleCancel}
              isDisabled={isLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              type="submit" 
              colorScheme="blue" 
              isLoading={isLoading}
              isDisabled={isLoading}
              loadingText={t('common.saving')}
            >
              {t('common.save')}
            </Button>
          </Flex>
        </form>
      </Box>
    </Box>
  );
};

export default AddProduct; 