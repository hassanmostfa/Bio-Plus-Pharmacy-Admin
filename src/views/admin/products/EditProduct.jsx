import React, { useEffect, useState } from 'react';
import {
  Box,
  Image,
  Badge,
  Button,
  Flex,
  Input,
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
  Spinner,
} from '@chakra-ui/react';
import { FaUpload, FaTrash, FaArrowUp, FaArrowDown } from 'react-icons/fa6';
import { IoMdArrowBack } from 'react-icons/io';
import { useNavigate, useParams } from 'react-router-dom';
import { useGetVarientsQuery } from 'api/varientSlice';
import { useGetCategoriesQuery } from 'api/categorySlice';
import { useGetBrandsQuery } from 'api/brandSlice';
import { useGetProductQuery, useUpdateProductMutation } from 'api/productSlice';
import Swal from 'sweetalert2';
import { useAddFileMutation } from 'api/filesSlice';
import { useGetTypesQuery } from 'api/typeSlice';
import { useTranslation } from "react-i18next";
import i18n from "../../../i18n";

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // State for form fields
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [cost, setCost] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [sku, setSku] = useState('');
  const [productTypeId, setProductTypeId] = useState('');
  const [offerType, setOfferType] = useState('');
  const [offerPercentage, setOfferPercentage] = useState('');
  const [hasVariants, setHasVariants] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const [images, setImages] = useState([]); // Newly uploaded images
  const [existingImages, setExistingImages] = useState([]); // Existing images from server
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedAttributes, setSelectedAttributes] = useState([]);

  // New states for additional fields
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

  // API queries
  const { data: productResponse, isLoading: isProductLoading , refetch } =
    useGetProductQuery(id);

  // Trigger refetch when component mounts (navigates to)
  React.useEffect(() => {
    // Only trigger refetch if the data is not being loaded
    if (!isProductLoading) {
      refetch(); // Manually trigger refetch when component is mounted
    }
  }, [refetch, isProductLoading]); // Dependency array to ensure it only runs on mount

  const { data: categoriesResponse } = useGetCategoriesQuery({
    page: 1,
    limit: 1000,
  });
  const { data: variantsResponse } = useGetVarientsQuery({
    page: 1,
    limit: 1000,
  });
  const { data: brandsResponse } = useGetBrandsQuery({ page: 1, limit: 1000 });
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();

  const { data: productTypesResponse } = useGetTypesQuery({ page: 1, limit: 1000 }); // Fetch product types
  const productTypes = productTypesResponse?.data?.items || []; // Get product types from response

  // Extract data from responses
  const product = productResponse?.data;
  const categories = categoriesResponse?.data?.data || [];
  const variants = variantsResponse?.data || [];
  const brands = brandsResponse?.data || [];
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const inputBg = useColorModeValue('gray.100', 'gray.700');
  const inputTextColor = useColorModeValue(undefined, 'white');
  const uploadBg = useColorModeValue('gray.100', 'gray.700');
  const [addFile] = useAddFileMutation();

  // Initialize form with product data
  useEffect(() => {
    if (product) {
      setNameEn(product.name || '');
      setNameAr(
        product.translations?.find((t) => t.languageId === 'ar')?.name || '',
      );
      setDescriptionEn(product.description || '');
      setDescriptionAr(
        product.translations?.find((t) => t.languageId === 'ar')?.description ||
          '',
      );
      setCategoryId(product.categoryId || '');
      setBrandId(product.brandId || '');
      setProductTypeId(product.productTypeId || '');
      setCost(product.cost || '');
      setPrice(product.price || '');
      setQuantity(product.quantity || '');
      setSku(product.sku || '');
      setOfferType(product.offerType || '');
      setOfferPercentage(product.offerPercentage || '');
      setHasVariants(product.hasVariants || false);
      setIsActive(product.isActive ?? true);
      setIsPublished(product.isPublished ?? false);

      // Set additional fields
      setLotNumber(product.lotNumber || '');
      setExpiryDate(product.expiryDate || '');
      setHowToUseEn(product.howToUse || '');
      setHowToUseAr(
        product.translations?.find((t) => t.languageId === 'ar')?.howToUse || '',
      );
      setTreatmentEn(product.treatment || '');
      setTreatmentAr(
        product.translations?.find((t) => t.languageId === 'ar')?.treatment || '',
      );
      setIngredientsEn(product.ingredient || '');
      setIngredientsAr(
        product.translations?.find((t) => t.languageId === 'ar')?.ingredient || '',
      );
      setDiscount(product.discount || null);
      setDiscountType(product.discountType || null);

      // Set existing images
      if (product.images?.length > 0) {
        const imagesWithIds = product.images.map((img, index) => ({
          ...img,
          id: img.id || `existing-${index}-${Date.now()}` // Ensure each image has a unique ID
        }));
        setExistingImages(imagesWithIds);
        const mainIndex = imagesWithIds.findIndex((img) => img.isMain);
        setMainImageIndex(mainIndex >= 0 ? mainIndex : 0);
      }

      // Set variants if they exist
      if (product.variants?.length > 0) {
        const attributes = product.variants.map((variant) => ({
          variantId: variant.variantId,
          variantName: variant.variantName || 'Variant',
          attributeId: variant.attributeId,
          attributeValue: variant.attributeValue || '',
          cost: variant.cost || '',
          price: variant.price || '',
          quantity: variant.quantity || '',
          image: null, // For new file uploads
          imageKey: variant.imageKey || null, // For existing images from API
          isActive: variant.isActive ?? true,
          lotNumber: variant.lotNumber || '',
          expiryDate: variant.expiryDate || '',
        }));
        setSelectedAttributes(attributes);
      }
    }
  }, [product]);

  // Image handling
  const handleImageUpload = (files) => {
    if (files && files.length > 0) {
      const newImages = Array.from(files)
        .map((file) => {
          // Validate file type
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

  const handleRemoveImage = (imageId, isExisting) => {
    if (isExisting) {
      // Mark existing image for deletion
      const updatedExistingImages = [...existingImages];
      const index = updatedExistingImages.findIndex(img => img.id === imageId);
      if (index !== -1) {
        updatedExistingImages[index].toDelete = true;
        setExistingImages(updatedExistingImages);
      }
    } else {
      // Remove newly uploaded image
      const imageToRemove = images.find(img => img.id === imageId);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      const newImages = images.filter(img => img.id !== imageId);
      setImages(newImages);
      
      // Always set the first image (order 1) as main image after removal
      setMainImageIndex(0);
    }
  };

  const handleSetMainImage = (imageId, isExisting) => {
    if (isExisting) {
      const index = existingImages.findIndex(img => img.id === imageId);
      if (index !== -1) {
        // Move the selected existing image to first position and set as main
        const newExistingImages = [...existingImages];
        const selectedImage = newExistingImages.splice(index, 1)[0];
        newExistingImages.unshift(selectedImage);
        setExistingImages(newExistingImages);
        setMainImageIndex(0);
      }
    } else {
      const index = images.findIndex(img => img.id === imageId);
      if (index !== -1) {
        // Move the selected new image to first position and set as main
        const newImages = [...images];
        const selectedImage = newImages.splice(index, 1)[0];
        newImages.unshift(selectedImage);
        setImages(newImages);
        setMainImageIndex(0);
      }
    }
  };

  // Reorder images
  const moveImage = (imageId, direction, isExisting) => {
    let currentImages, setCurrentImages;
    
    if (isExisting) {
      currentImages = existingImages;
      setCurrentImages = setExistingImages;
    } else {
      currentImages = images;
      setCurrentImages = setImages;
    }
    
    const currentIndex = currentImages.findIndex(img => img.id === imageId);
    if (currentIndex === -1) return;

    const newImages = [...currentImages];
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
    
    setCurrentImages(newImages);
    
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
      // Upload new product images first
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

      // Prepare existing images (excluding those marked for deletion)
      const existingImagesToKeep = existingImages
        .filter((img) => !img.toDelete)
        .map((img, index) => ({
          imageKey: img.imageKey,
          order: index,
          isMain: index === mainImageIndex,
        }));

      // Combine existing and new images
      const allImages = [...existingImagesToKeep, ...uploadedImages];

      // Upload variant images if they exist
      const variantsWithImages = await Promise.all(
        selectedAttributes.map(async (attr) => {
          if (attr.image && attr.image instanceof File) {
            const formData = new FormData();
            formData.append('file', attr.image);

            const uploadResponse = await addFile(formData).unwrap();

            if (
              uploadResponse.success &&
              uploadResponse.data.uploadedFiles.length > 0
            ) {
              return {
                ...attr,
                imageKey: uploadResponse.data.uploadedFiles[0].url,
              };
            }
          }
          // If no new image was uploaded, keep the existing imageKey
          return {
            ...attr,
            imageKey: attr.imageKey || undefined,
          };
        }),
      );

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

      // Prepare variants data
      const variantsData = variantsWithImages.map((attr) => {
        if (!attr.price) {
          throw new Error('Price is required for each variant.');
        }
        return {
          variantId: attr.variantId,
          attributeId: attr.attributeId,
          cost: attr.cost ? parseFloat(attr.cost) : 0,
          price: parseFloat(attr.price),
          quantity: attr.quantity ? parseInt(attr.quantity) : 0,
          imageKey: attr.imageKey || undefined,
          isActive: attr.isActive,
          lotNumber: attr.lotNumber || undefined,
          expiryDate: attr.expiryDate || undefined,
        };
      });

      // Prepare product data
      if (!price) {
        throw new Error('Price is required for the product.');
      }
      const productData = {
        name: nameEn || undefined,
        description: descriptionEn || undefined,
        howToUse: howToUseEn || undefined,
        treatment: treatmentEn || undefined,
        ingredient: ingredientsEn || undefined,
        categoryId: categoryId || undefined,
        brandId: brandId || undefined,
        pharmacyId: JSON.parse(localStorage.getItem('pharmacy'))?.id,
        productTypeId: productTypeId || undefined,
        cost: cost === null ? undefined : parseFloat(cost),
        price: parseFloat(price),
        sku: sku || undefined,
        quantity: quantity === null ? undefined : parseInt(quantity),
        discount: discount != null ? parseFloat(discount) : undefined,
        discountType: discountType,
        lotNumber: lotNumber || undefined,
        expiryDate: expiryDate || undefined,
        offerType:
          offerType === null || offerType === ''
            ? undefined
            : offerType.toUpperCase().replace(' ', '_'),
        offerPercentage:
          offerType === null || offerType === '' || offerPercentage == null 
            ? undefined 
            : parseFloat(offerPercentage),
        hasVariants,
        isActive,
        isPublished,
        translations: translations.filter((t) => t.name && t.description),
        images: allImages,
        variants: hasVariants ? variantsData : undefined,
      };

      // Remove any keys that are null
      Object.keys(productData).forEach((key) => {
        if (productData[key] == null || productData[key] === undefined) {
          delete productData[key];
        }
      });

      // Submit to API
      const response = await updateProduct({
        id: id,
        data: productData,
      }).unwrap();

      toast({
        title: 'Success',
        description: 'Product updated successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      navigate('/admin/products');
    } catch (err) {
      toast({
        title: 'Error',
        description:
          err.data?.message || err.message || 'Failed to update product',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleCancel = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You will lose all unsaved changes',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, discard changes',
    }).then((result) => {
      if (result.isConfirmed) {
        navigate('/admin/products');
      }
    });
  };

  if (isProductLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box bg={inputBg} className="container add-admin-container w-100" dir={isRTL ? 'rtl' : 'ltr'}>
      <Box bg={inputBg} className="add-admin-card shadow p-4 w-100">
        <Flex className="mb-3 d-flex justify-content-between align-items-center">
          <Text
            color={textColor}
            fontSize="22px"
            fontWeight="700"
            mb="20px !important"
            lineHeight="100%"
          >
            {t('productForm.editProduct')}
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

          {/* Category, Brand and Product Type */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
            <Box>
              <FormControl isRequired>
                <FormLabel>{t('productForm.category')}</FormLabel>
                <Select
                  placeholder={t('productForm.selectCategory')}
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  bg={inputBg}
                  color={inputTextColor}
                  style={{ direction: 'ltr' }}
                >
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.translations?.find((t) => t.languageId === 'en')
                        ?.name || cat.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box>
              <FormControl isRequired>
                <FormLabel>{t('productForm.brand')}</FormLabel>
                <Select
                  placeholder={t('productForm.selectBrand')}
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                  bg={inputBg}
                  color={inputTextColor}
                  style={{ direction: 'ltr' }}
                >
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box>
              <FormControl>
                <FormLabel>{t('productForm.productType')}</FormLabel>
                <Select
                  placeholder={t('productForm.selectProductType')}
                  value={productTypeId}
                  onChange={(e) => setProductTypeId(e.target.value)}
                  bg={inputBg}
                  color={inputTextColor}
                  style={{ direction: 'ltr' }}
                >
                  {productTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </Select>
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
                            {(attr.image || attr.imageKey) && (
                              <Image
                                src={attr.image instanceof File ? URL.createObjectURL(attr.image) : (attr.imageKey || attr.image)}
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
                      <FormControl isRequired={images.length === 0 && existingImages.filter(img => !img.toDelete).length === 0}>
            <FormLabel>
              {t('productForm.productImages')}
              {images.length === 0 && existingImages.filter(img => !img.toDelete).length === 0 && <span style={{ color: 'red' }}>*</span>}
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
                {(existingImages.filter(img => !img.toDelete).length > 0 || images.length > 0) ? (
                  <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                    {/* Existing Images */}
                    {existingImages.filter(img => !img.toDelete).map((img, index) => (
                      <Box key={img.id} position="relative" display="flex" flexDirection="column" alignItems="center">
                        <Image
                          src={img.imageKey}
                          alt={t('productForm.productImage', { index: index + 1 })}
                          borderRadius="md"
                          maxH="150px"
                          border={mainImageIndex === index ? '2px solid' : '1px solid'}
                          borderColor={mainImageIndex === index ? 'brand.500' : 'gray.300'}
                          cursor="pointer"
                          onClick={() => handleSetMainImage(img.id, true)}
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
                            onClick={() => handleRemoveImage(img.id, true)}
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
                            onClick={() => moveImage(img.id, 'up', true)}
                          />
                          <IconButton
                            icon={<FaArrowDown />}
                            aria-label="Move down"
                            size="sm"
                            colorScheme="blue"
                            variant="solid"
                            isDisabled={index === existingImages.filter(img => !img.toDelete).length - 1}
                            onClick={() => moveImage(img.id, 'down', true)}
                          />
                        </Flex>
                        
                        {/* Image Order Badge */}
                        <Badge position="absolute" bottom={2} left={2} colorScheme="gray">
                          {index + 1}
                        </Badge>
                      </Box>
                    ))}
                    {/* New Images */}
                    {images.map((img, index) => (
                      <Box key={img.id} position="relative" display="flex" flexDirection="column" alignItems="center">
                        <Image
                          src={img.preview}
                          alt={t('productForm.productImage', { index: existingImages.filter(img => !img.toDelete).length + index + 1 })}
                          borderRadius="md"
                          maxH="150px"
                          border={mainImageIndex === existingImages.filter(img => !img.toDelete).length + index ? '2px solid' : '1px solid'}
                          borderColor={mainImageIndex === existingImages.filter(img => !img.toDelete).length + index ? 'brand.500' : 'gray.300'}
                          cursor="pointer"
                          onClick={() => handleSetMainImage(img.id, false)}
                        />
                        {mainImageIndex === existingImages.filter(img => !img.toDelete).length + index && (
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
                            onClick={() => handleRemoveImage(img.id, false)}
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
                            onClick={() => moveImage(img.id, 'up', false)}
                          />
                          <IconButton
                            icon={<FaArrowDown />}
                            aria-label="Move down"
                            size="sm"
                            colorScheme="blue"
                            variant="solid"
                            isDisabled={index === images.length - 1}
                            onClick={() => moveImage(img.id, 'down', false)}
                          />
                        </Flex>
                        
                        {/* Image Order Badge */}
                        <Badge position="absolute" bottom={2} left={2} colorScheme="gray">
                          {existingImages.filter(img => !img.toDelete).length + index + 1}
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
              isDisabled={isUpdating}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              type="submit" 
              colorScheme="blue" 
              isLoading={isUpdating}
              isDisabled={isUpdating}
              loadingText={t('common.saving')}
            >
              {t('common.update')}
            </Button>
          </Flex>
        </form>
      </Box>
    </Box>
  );
};

export default EditProduct;