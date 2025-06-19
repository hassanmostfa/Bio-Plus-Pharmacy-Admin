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

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

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

  const cardBg = useColorModeValue('white', 'navy.700');
  const inputBg = useColorModeValue('gray.100', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');
  const uploadBg = inputBg;
  const uploadDragBg = useColorModeValue('blue.50', 'brand.900');
  const inputTextColor = useColorModeValue(undefined, 'white');

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
        <Text>Product not found</Text>
      </Flex>
    );
  }

  return (
    <Flex direction="column" align="center" w="100%" mt={20}>
      <Box bg={cardBg} borderRadius="lg" borderWidth="1px" borderColor={borderColor} p={6} w="100%" maxW="1200px">
        <Flex mb={3} justify="space-between" align="center">
          <Text
            color={textColor}
            fontSize="22px"
            fontWeight="700"
            mb="20px !important"
            lineHeight="100%"
          >
            Edit Product
          </Text>
          <Button
            type="button"
            onClick={handleCancel}
            colorScheme="teal"
            size="sm"
            leftIcon={<IoMdArrowBack />}
          >
            Back
          </Button>
        </Flex>
        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
            <Box>
              <FormControl isRequired>
                <FormLabel>Product Name (English)</FormLabel>
                <Input
                  placeholder="Enter Product Name"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  bg={inputBg}
                  color={inputTextColor}
                />
              </FormControl>
            </Box>
            <Box>
              <FormControl>
                <FormLabel>Product Name (Arabic)</FormLabel>
                <Input
                  placeholder="أدخل اسم المنتج"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  dir="rtl"
                  bg={inputBg}
                  color={inputTextColor}
                />
              </FormControl>
            </Box>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
            <Box>
              <FormControl isRequired>
                <FormLabel>Description (English)</FormLabel>
                <Textarea
                  placeholder="Enter Product Description"
                  value={descriptionEn}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                  bg={inputBg}
                  color={inputTextColor}
                />
              </FormControl>
            </Box>
            <Box>
              <FormControl>
                <FormLabel>Description (Arabic)</FormLabel>
                <Textarea
                  placeholder="أدخل وصف المنتج"
                  value={descriptionAr}
                  onChange={(e) => setDescriptionAr(e.target.value)}
                  dir="rtl"
                  bg={inputBg}
                  color={inputTextColor}
                />
              </FormControl>
            </Box>
          </SimpleGrid>

          {/* Category, Brand, and Pharmacy */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
            <Box>
              <FormControl isRequired>
                <FormLabel>Category</FormLabel>
                <Select
                  placeholder="Select Category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  bg={inputBg}
                  color={inputTextColor}
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
                <FormLabel>Brand</FormLabel>
                <Select
                  placeholder="Select Brand"
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                  bg={inputBg}
                  color={inputTextColor}
                >
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </Box>
            {/* <Box>
              <FormControl isRequired>
                <FormLabel>Pharmacy</FormLabel>
                <Select
                  placeholder="Select Pharmacy"
                  value={pharmacyId}
                  onChange={(e) => setPharmacyId(e.target.value)}
                >
                  {pharmacies.map((pharmacy) => (
                    <option key={pharmacy.id} value={pharmacy.id}>
                      {pharmacy.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </Box> */}

            <Box>
                <FormControl>
                  <FormLabel>Product Type</FormLabel>
                  <Select
                    placeholder="Select Product Type"
                    value={productTypeId}
                    onChange={(e) => setProductTypeId(e.target.value)}
                    bg={inputBg}
                    color={inputTextColor}
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

          {/* Pricing Information */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
            <Box>
              <FormControl>
                <FormLabel>Cost</FormLabel>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  bg={inputBg}
                  color={inputTextColor}
                />
              </FormControl>
            </Box>
            <Box>
              <FormControl isRequired>
                <FormLabel>Price</FormLabel>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  bg={inputBg}
                  color={inputTextColor}
                />
              </FormControl>
            </Box>
            <Box>
              <FormControl>
                <FormLabel>Quantity</FormLabel>
                <Input
                  type="number"
                  placeholder="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  bg={inputBg}
                  color={inputTextColor}
                />
              </FormControl>
            </Box>
          </SimpleGrid>

          {/* Offer Type */}
          <Box mb={4}>
            <FormLabel>Offer Type</FormLabel>
            <RadioGroup
              value={offerType}
              onChange={(value) => {
                setOfferType(value);
                if (value !== 'MONTHLY_OFFER') {
                  setOfferPercentage('');
                }
              }}
            >
              <Stack direction="row">
                <Radio value="MONTHLY_OFFER">Monthly Offer</Radio>
                <Radio value="NEW_ARRIVAL">New Arrival</Radio>
                <Radio value="">None</Radio>
              </Stack>
            </RadioGroup>
            {offerType === 'MONTHLY_OFFER' && (
              <Box mt={2}>
                <FormControl>
                  <FormLabel>Offer Percentage</FormLabel>
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={offerPercentage}
                    onChange={(e) => setOfferPercentage(e.target.value)}
                    bg={inputBg}
                    color={inputTextColor}
                  />
                </FormControl>
              </Box>
            )}
          </Box>

          {/* Status Switches */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
            <FormControl display="flex" alignItems="center">
              <FormLabel mb="0">Has Variants</FormLabel>
              <Switch
                isChecked={hasVariants}
                onChange={() => setHasVariants(!hasVariants)}
              />
            </FormControl>
            <FormControl display="flex" alignItems="center">
              <FormLabel mb="0">Active</FormLabel>
              <Switch
                isChecked={isActive}
                onChange={() => setIsActive(!isActive)}
              />
            </FormControl>
            <FormControl display="flex" alignItems="center">
              <FormLabel mb="0">Published</FormLabel>
              <Switch
                isChecked={isPublished}
                onChange={() => setIsPublished(!isPublished)}
              />
            </FormControl>
          </SimpleGrid>

          {/* Variants Section */}
          {hasVariants && (
            <Box mb={4}>
              <FormControl mb={4}>
                <FormLabel>Select Variant</FormLabel>
                <Select
                  placeholder="Select Variant"
                  onChange={handleVariantSelect}
                  bg={inputBg}
                  color={inputTextColor}
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
                    <Card key={index} bg={cardBg} borderColor={borderColor} borderWidth="1px">
                      <CardHeader>
                        <Flex justify="space-between" align="center">
                          <Text fontWeight="bold">
                            {attr.variantName} - {attr.attributeValue}
                          </Text>
                          <IconButton
                            icon={<FaTrash />}
                            aria-label="Delete variant"
                            size="sm"
                            colorScheme="red"
                            onClick={() => handleDeleteAttribute(index)}
                          />
                        </Flex>
                      </CardHeader>
                      <CardBody>
                        <SimpleGrid columns={2} spacing={2}>
                          <FormControl>
                            <FormLabel>Cost</FormLabel>
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
                            />
                          </FormControl>
                          <FormControl isRequired>
                            <FormLabel>Price</FormLabel>
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
                            />
                          </FormControl>
                          <FormControl>
                            <FormLabel>Quantity</FormLabel>
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
                              bg={inputBg}
                              color={inputTextColor}
                            />
                          </FormControl>
                          <FormControl>
                            <FormLabel>Variant Image</FormLabel>
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
                              bg={inputBg}
                              color={inputTextColor}
                            />
                            {attr.image && (
                              <Box mt={2}>
                                <Image
                                  src={attr.image ? attr.image.name : undefined}
                                  alt="Selected variant"
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
              <FormLabel>Product Images</FormLabel>
              <Box
                border="1px dashed"
                borderColor={isDragging ? 'blue.500' : borderColor}
                borderRadius="md"
                p={4}
                textAlign="center"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                cursor="pointer"
                bg={isDragging ? uploadDragBg : uploadBg}
              >
                <Icon as={FaUpload} w={8} h={8} color="blue.500" mb={2} />
                <Text>Drag & drop images here or</Text>
                <Button
                  variant="link"
                  color="blue.500"
                  onClick={() => document.getElementById('file-upload').click()}
                >
                  Browse Files
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
                        index === mainImageIndex ? 'blue.500' : borderColor
                      }
                      cursor="pointer"
                      onClick={() => handleSetMainImage(index, true)}
                    />
                    {index === mainImageIndex && (
                      <Badge
                        position="absolute"
                        top={2}
                        left={2}
                        colorScheme="blue"
                      >
                        Main
                      </Badge>
                    )}
                    <IconButton
                      icon={<FaTrash />}
                      aria-label="Remove image"
                      size="sm"
                      colorScheme="red"
                      position="absolute"
                      top={2}
                      right={2}
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
                            : borderColor
                        }
                        cursor="pointer"
                        onClick={() => handleSetMainImage(globalIndex, false)}
                      />
                      {globalIndex === mainImageIndex && (
                        <Badge
                          position="absolute"
                          top={2}
                          left={2}
                          colorScheme="blue"
                        >
                          Main
                        </Badge>
                      )}
                      <IconButton
                        icon={<FaTrash />}
                        aria-label="Remove image"
                        size="sm"
                        colorScheme="red"
                        position="absolute"
                        top={2}
                        right={2}
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
              Cancel
            </Button>
            <Button type="submit" colorScheme="blue" isLoading={isUpdating}>
              Update Product
            </Button>
          </Flex>
        </form>
      </Box>
    </Flex>
  );
};

export default EditProduct;
