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
import { FaUpload, FaTrash } from 'react-icons/fa6';
import { IoMdArrowBack } from 'react-icons/io';
import { useNavigate, useParams } from 'react-router-dom';
import { useGetVarientsQuery } from 'api/varientSlice';
import { useGetCategoriesQuery } from 'api/categorySlice';
import { useGetBrandsQuery } from 'api/brandSlice';
import { useGetPharmaciesQuery } from 'api/pharmacySlice';
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
  const [pharmacyId, setPharmacyId] = useState('');
  const [cost, setCost] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [productTypeId, setProductTypeId] = useState(''); // New state for product type
  const [offerType, setOfferType] = useState('');
  const [offerPercentage, setOfferPercentage] = useState('');
  const [hasVariants, setHasVariants] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const [images, setImages] = useState([]); // Newly uploaded images
  const [existingImages, setExistingImages] = useState([]); // Existing images from server
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

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
  const { data: pharmaciesResponse } = useGetPharmaciesQuery({
    page: 1,
    limit: 1000,
  });
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();

  const { data: productTypesResponse } = useGetTypesQuery({ page: 1, limit: 1000 }); // Fetch product types
  const productTypes = productTypesResponse?.data?.items || []; // Get product types from response

  // Extract data from responses
  const product = productResponse?.data;
  const categories = categoriesResponse?.data?.data || [];
  const variants = variantsResponse?.data || [];
  const brands = brandsResponse?.data || [];
  const pharmacies = pharmaciesResponse?.data?.items || [];
  const textColor = useColorModeValue('secondaryGray.900', 'white');
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
      setPharmacyId(product.pharmacyId || '');
      setProductTypeId(product.productTypeId || '');
      setCost(product.cost || '');
      setPrice(product.price || '');
      setQuantity(product.quantity || '');
      setOfferType(product.offerType || '');
      setOfferPercentage(product.offerPercentage || '');
      setHasVariants(product.hasVariants || false);
      setIsActive(product.isActive ?? true);
      setIsPublished(product.isPublished ?? false);

      // Set existing images
      if (product.images?.length > 0) {
        setExistingImages(product.images);
        const mainIndex = product.images.findIndex((img) => img.isMain);
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
          image: variant.imageKey
            ? { name: variant.imageKey }
            : null,
          isActive: variant.isActive ?? true,
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
            isMain: images.length === 0 && existingImages.length === 0, // First image is main if no others exist
          };
        })
        .filter((img) => img !== null);

      setImages([...images, ...newImages]);

      // Set first uploaded image as main if no main exists
      if (
        existingImages.length === 0 &&
        images.length === 0 &&
        newImages.length > 0
      ) {
        setMainImageIndex(0);
      }
    }
  };

  const handleSetMainImage = (index, isExisting) => {
    if (isExisting) {
      setMainImageIndex(index);
      // Update isMain flags for existing images
      setExistingImages(
        existingImages.map((img, i) => ({
          ...img,
          isMain: i === index,
        })),
      );
    } else {
      // For new images, the index is offset by existing images count
      setMainImageIndex(index + existingImages.length);
    }
  };

  const handleRemoveImage = (index, isExisting) => {
    if (isExisting) {
      setExistingImages(existingImages.filter((_, i) => i !== index));
      if (mainImageIndex === index) {
        setMainImageIndex(0); // Reset to first image if main was removed
      } else if (mainImageIndex > index) {
        setMainImageIndex(mainImageIndex - 1); // Adjust index if needed
      }
    } else {
      const newIndex = index - existingImages.length;
      URL.revokeObjectURL(images[newIndex].preview); // Clean up memory

      const newImages = images.filter((_, i) => i !== newIndex);
      setImages(newImages);

      if (mainImageIndex === index) {
        setMainImageIndex(0);
      } else if (mainImageIndex > index) {
        setMainImageIndex(mainImageIndex - 1);
      }
    }
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

  // Add this with your other state declarations
  const [selectedAttributes, setSelectedAttributes] = useState([]);

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
      // Upload new images first
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
              order: existingImages.length + index,
              isMain: existingImages.length + index === mainImageIndex,
            };
          }
          return null;
        });

        const results = await Promise.all(imageUploadPromises);
        uploadedImages.push(...results.filter((img) => img !== null));
      }

      // Prepare existing images data
      const existingImagesData = existingImages.map((img, index) => ({
        id: img.id,
        imageKey: img.imageKey,
        order: index,
        isMain: index === mainImageIndex,
      }));

      // Prepare translations
      const translations = [];
      if (nameAr || descriptionAr) {
        translations.push({
          languageId: 'ar',
          name: nameAr,
          description: descriptionAr,
        });
      }
      if (nameEn || descriptionEn) {
        translations.push({
          languageId: 'en',
          name: nameEn,
          description: descriptionEn,
        });
      }

      // Prepare variants data
      const variantsData = selectedAttributes.map((attr) => ({
        variantId: attr.variantId,
        attributeId: attr.attributeId,
        cost: parseFloat(attr.cost) || 0,
        price: parseFloat(attr.price) || 0,
        quantity: parseInt(attr.quantity) || 0,
        imageKey: attr.imageKey || undefined,
        isActive: attr.isActive,
      }));

      // Prepare product data
      const productData = {
        name: nameEn,
        description: descriptionEn,
        categoryId,
        brandId,
        pharmacyId: JSON.parse(localStorage.getItem('pharmacy')).id,
        productTypeId,
        cost: cost ? parseFloat(cost) : null,
        price: parseFloat(price),
        quantity: quantity ? parseInt(quantity) : null,
        offerType: offerType || null,
        offerPercentage: offerPercentage ? parseFloat(offerPercentage) : null,
        hasVariants,
        isActive,
        isPublished,
        translations: translations.filter((t) => t.name && t.description),
        images: [...existingImagesData, ...uploadedImages],
        // variants: hasVariants ? variantsData : [],
      };

      // Remove null values
      Object.keys(productData).forEach((key) => {
        if (productData[key] === null || productData[key] === undefined) {
          delete productData[key];
        }
      });

      // Submit to API
      const response = await updateProduct({ id, data: productData }).unwrap();

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
      title: isRTL ? 'هل أنت متأكد؟' : 'Are you sure?',
      text: isRTL ? 'سوف تفقد جميع التغييرات غير المحفوظة' : 'You will lose all unsaved changes',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: isRTL ? 'نعم، تجاهل التغييرات' : 'Yes, discard changes',
    }).then((result) => {
      if (result.isConfirmed) {
        navigate('/admin/products');
      }
    });
  };

  if (isProductLoading) {
    return (
      <Flex justify="center" align="center" minH="100vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (!product) {
    return (
      <Flex justify="center" align="center" minH="100vh">
        <Text>{isRTL ? 'المنتج غير موجود' : 'Product not found'}</Text>
      </Flex>
    );
  }

  return (
    <div className="container add-admin-container w-100" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="add-admin-card shadow p-4 bg-white w-100">
        <div className="mb-3 d-flex justify-content-between align-items-center">
          <Text
            color={textColor}
            fontSize="22px"
            fontWeight="700"
            mb="20px !important"
            lineHeight="100%"
          >
            {isRTL ? 'تعديل المنتج' : 'Edit Product'}
          </Text>
          <Button
            type="button"
            onClick={handleCancel}
            colorScheme="teal"
            size="sm"
            leftIcon={!isRTL ? <IoMdArrowBack /> : null}
            rightIcon={isRTL ? <IoMdArrowBack /> : null}
          >
            {isRTL ? 'رجوع' : 'Back'}
          </Button>
        </div>
        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
            <Box>
              <FormControl isRequired>
                <FormLabel>{t('productForm.nameEn')}</FormLabel>
                <Input
                  placeholder={isRTL ? 'أدخل اسم المنتج بالإنجليزية' : 'Enter Product Name'}
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </FormControl>
            </Box>
            <Box>
              <FormControl>
                <FormLabel>{t('productForm.nameAr')}</FormLabel>
                <Input
                  placeholder={isRTL ? 'أدخل اسم المنتج' : 'Enter Product Name in Arabic'}
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  dir="rtl"
                />
              </FormControl>
            </Box>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
            <Box>
              <FormControl isRequired>
                <FormLabel>{t('productForm.descriptionEn')}</FormLabel>
                <Textarea
                  placeholder={isRTL ? 'أدخل وصف المنتج بالإنجليزية' : 'Enter Product Description'}
                  value={descriptionEn}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </FormControl>
            </Box>
            <Box>
              <FormControl>
                <FormLabel>{t('productForm.descriptionAr')}</FormLabel>
                <Textarea
                  placeholder={isRTL ? 'أدخل وصف المنتج' : 'Enter Product Description in Arabic'}
                  value={descriptionAr}
                  onChange={(e) => setDescriptionAr(e.target.value)}
                  dir="rtl"
                />
              </FormControl>
            </Box>
          </SimpleGrid>

          {/* Category, Brand, and Pharmacy */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
            <Box>
              <FormControl isRequired>
                <FormLabel>{t('productForm.category')}</FormLabel>
                <Box dir="ltr">
                  <Select
                    placeholder={isRTL ? 'اختر الفئة' : 'Select Category'}
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    
                  >
                    {categories?.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {isRTL 
                          ? cat.translations?.find((t) => t.languageId === 'ar')?.name || cat.name
                          : cat.translations?.find((t) => t.languageId === 'en')?.name || cat.name}
                      </option>
                    ))}
                  </Select>
                </Box>
              </FormControl>
            </Box>
            <Box>
              <FormControl isRequired>
                <FormLabel>{t('productForm.brand')}</FormLabel>
                <Box dir="ltr">
                  <Select
                    placeholder={isRTL ? 'اختر الماركة' : 'Select Brand'}
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value)}
                    
                  >
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </Select>
                </Box>
              </FormControl>
            </Box>

            <Box>
              <FormControl>
                <FormLabel>{t('productForm.productType')}</FormLabel>
                <Box dir="ltr">
                  <Select
                    placeholder={isRTL ? 'اختر نوع المنتج' : 'Select Product Type'}
                    value={productTypeId}
                    onChange={(e) => setProductTypeId(e.target.value)}
                    
                  >
                    {productTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </Select>
                </Box>
              </FormControl>
            </Box>
          </SimpleGrid>

          {/* Pricing Information */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
            <Box>
              <FormControl>
                <FormLabel>{t('productForm.cost')}</FormLabel>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </FormControl>
            </Box>
            <Box>
              <FormControl isRequired>
                <FormLabel>{t('productForm.price')}</FormLabel>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </FormControl>
            </Box>
            <Box>
              <FormControl>
                <FormLabel>{t('productForm.quantity')}</FormLabel>
                <Input
                  type="number"
                  placeholder="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </FormControl>
            </Box>
          </SimpleGrid>

          {/* Offer Type */}
          <Box mb={4}>
            <FormLabel>{t('productForm.offerType')}</FormLabel>
            <RadioGroup
              value={offerType}
              onChange={(value) => {
                setOfferType(value);
                if (value !== 'MONTHLY_OFFER') {
                  setOfferPercentage('');
                }
              }}
            >
              <Stack direction={isRTL ? 'row-reverse' : 'row'}>
                <Radio value="MONTHLY_OFFER">{isRTL ? 'عرض شهري' : 'Monthly Offer'}</Radio>
                <Radio value="NEW_ARRIVAL">{isRTL ? 'وصل حديثاً' : 'New Arrival'}</Radio>
                <Radio value="">{isRTL ? 'لا يوجد' : 'None'}</Radio>
              </Stack>
            </RadioGroup>
            {offerType === 'MONTHLY_OFFER' && (
              <Box mt={2}>
                <FormControl>
                  <FormLabel>{t('productForm.offerPercentage')}</FormLabel>
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={offerPercentage}
                    onChange={(e) => setOfferPercentage(e.target.value)}
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                </FormControl>
              </Box>
            )}
          </Box>

          {/* Status Switches */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
            <FormControl display="flex" alignItems="center" flexDirection={isRTL ? 'row-reverse' : 'row'}>
              <FormLabel mb="0" ml={isRTL ? 2 : 3} mr={isRTL ? 3 : 2}>{t('productForm.hasVariants')}</FormLabel>
              <Box dir="ltr">
                <Switch
                  isChecked={hasVariants}
                  onChange={() => setHasVariants(!hasVariants)}
                />
              </Box>
            </FormControl>
            <FormControl display="flex" alignItems="center" flexDirection={isRTL ? 'row-reverse' : 'row'}>
              <FormLabel mb="0" ml={isRTL ? 2 : 3} mr={isRTL ? 3 : 2}>{t('productForm.active')}</FormLabel>
              <Box dir="ltr">
                <Switch
                  isChecked={isActive}
                  onChange={() => setIsActive(!isActive)}
                />
              </Box>
            </FormControl>
            <FormControl display="flex" alignItems="center" flexDirection={isRTL ? 'row-reverse' : 'row'}>
              <FormLabel mb="0" ml={isRTL ? 2 : 3} mr={isRTL ? 3 : 2}>{t('productForm.published')}</FormLabel>
              <Box dir="ltr">
                <Switch
                  isChecked={isPublished}
                  onChange={() => setIsPublished(!isPublished)}
                />
              </Box>
            </FormControl>
          </SimpleGrid>

          {/* Variants Section */}
          {hasVariants && (
            <Box mb={4}>
              <FormControl mb={4}>
                <FormLabel>{t('productForm.selectVariant')}</FormLabel>
                <Box dir="ltr">
                  <Select
                    placeholder={isRTL ? 'اختر المتغير' : 'Select Variant'}
                    onChange={handleVariantSelect}
                    
                  >
                    {variants.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.name}
                      </option>
                    ))}
                  </Select>
                </Box>
              </FormControl>

              {selectedAttributes.length > 0 && (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {selectedAttributes.map((attr, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <Flex justify="space-between" align="center" direction={isRTL ? 'row-reverse' : 'row'}>
                          <Text fontWeight="bold">
                            {attr.variantName} - {attr.attributeValue}
                          </Text>
                          <IconButton
                            icon={<FaTrash />}
                            aria-label={isRTL ? 'حذف المتغير' : 'Delete variant'}
                            size="sm"
                            colorScheme="red"
                            onClick={() => handleDeleteAttribute(index)}
                          />
                        </Flex>
                      </CardHeader>
                      <CardBody>
                        <SimpleGrid columns={2} spacing={2}>
                          <FormControl>
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
                              dir={isRTL ? 'rtl' : 'ltr'}
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
                              dir={isRTL ? 'rtl' : 'ltr'}
                            />
                          </FormControl>
                          <FormControl>
                            <FormLabel>{t('productForm.quantity')}</FormLabel>
                            <Input
                              type="number"
                              value={attr.quantity}
                              onChange={(e) =>
                                handleAttributeChange(
                                  index,
                                  'quantity',
                                  e.target.value,
                                )
                              }
                              dir={isRTL ? 'rtl' : 'ltr'}
                            />
                          </FormControl>
                          <FormControl>
                            <FormLabel>{t('productForm.variantImage')}</FormLabel>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                handleAttributeChange(
                                  index,
                                  'image',
                                  e.target.files[0],
                                )
                              }
                              dir={isRTL ? 'rtl' : 'ltr'}
                            />
                            {attr.image && (
                              <Box mt={2}>
                                <Image
                                  src={attr.image ? attr.image.name : undefined}
                                  alt={isRTL ? 'المتغير المحدد' : 'Selected variant'}
                                  boxSize="100px"
                                  objectFit="cover"
                                  borderRadius="md"
                                />
                              </Box>
                            )}
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
            <FormControl>
              <FormLabel>{t('productForm.productImages')}</FormLabel>
              <Box
                border="1px dashed"
                borderColor={isDragging ? 'blue.500' : 'gray.200'}
                borderRadius="md"
                p={4}
                textAlign="center"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                cursor="pointer"
                bg={isDragging ? 'blue.50' : 'gray.50'}
              >
                <Icon as={FaUpload} w={8} h={8} color="blue.500" mb={2} />
                <Text>{t('productForm.dragDropImages')}</Text>
                <Button
                  variant="link"
                  color="blue.500"
                  onClick={() => document.getElementById('file-upload').click()}
                >
                  {t('productForm.browseFiles')}
                </Button>
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files)}
                  display="none"
                />
              </Box>
            </FormControl>
            {(existingImages.length > 0 || images.length > 0) && (
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mt={4}>
                {existingImages.map((img, index) => (
                  <Box key={`existing-${index}`} position="relative">
                    <Image
                      src={img.imageKey}
                      alt={`Product image ${index + 1}`}
                      borderRadius="md"
                      border={
                        index === mainImageIndex ? '2px solid' : '1px solid'
                      }
                      borderColor={
                        index === mainImageIndex ? 'blue.500' : 'gray.200'
                      }
                      cursor="pointer"
                      onClick={() => handleSetMainImage(index, true)}
                    />
                    {index === mainImageIndex && (
                      <Badge
                        position="absolute"
                        top={2}
                        left={isRTL ? 'auto' : 2}
                        right={isRTL ? 2 : 'auto'}
                        colorScheme="blue"
                      >
                        {t('productForm.main')}
                      </Badge>
                    )}
                    <IconButton
                      icon={<FaTrash />}
                      aria-label={isRTL ? 'إزالة الصورة' : 'Remove image'}
                      size="sm"
                      colorScheme="red"
                      position="absolute"
                      top={2}
                      left={isRTL ? 2 : 'auto'}
                      right={isRTL ? 'auto' : 2}
                      onClick={() => handleRemoveImage(index, true)}
                    />
                  </Box>
                ))}
                {images.map((img, index) => {
                  const globalIndex = existingImages.length + index;
                  return (
                    <Box key={`new-${index}`} position="relative">
                      <Image
                        src={img.preview}
                        alt={`New image ${index + 1}`}
                        borderRadius="md"
                        border={
                          globalIndex === mainImageIndex
                            ? '2px solid'
                            : '1px solid'
                        }
                        borderColor={
                          globalIndex === mainImageIndex
                            ? 'blue.500'
                            : 'gray.200'
                        }
                        cursor="pointer"
                        onClick={() => handleSetMainImage(globalIndex, false)}
                      />
                      {globalIndex === mainImageIndex && (
                        <Badge
                          position="absolute"
                          top={2}
                          left={isRTL ? 'auto' : 2}
                          right={isRTL ? 2 : 'auto'}
                          colorScheme="blue"
                        >
                          {t('productForm.main')}
                        </Badge>
                      )}
                      <IconButton
                        icon={<FaTrash />}
                        aria-label={isRTL ? 'إزالة الصورة' : 'Remove image'}
                        size="sm"
                        colorScheme="red"
                        position="absolute"
                        top={2}
                        left={isRTL ? 2 : 'auto'}
                        right={isRTL ? 'auto' : 2}
                        onClick={() => handleRemoveImage(globalIndex, false)}
                      />
                    </Box>
                  );
                })}
              </SimpleGrid>
            )}
          </Box>

          {/* Submit Buttons */}
          <Flex justify="flex-end" gap={4}>
            <Button variant="outline" colorScheme="red" onClick={handleCancel}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" colorScheme="blue" isLoading={isUpdating}>
              {isRTL ? 'تحديث المنتج' : 'Update Product'}
            </Button>
          </Flex>
        </form>
      </div>
    </div>
  );
};

export default EditProduct;