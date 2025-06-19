import React, { useState } from 'react';
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
} from '@chakra-ui/react';
import { FaUpload, FaTrash } from 'react-icons/fa6';
import { IoMdArrowBack } from 'react-icons/io';
import { useNavigate } from 'react-router-dom';
import { useGetVarientsQuery } from 'api/varientSlice';
import { useGetCategoriesQuery } from 'api/categorySlice';
import { useGetBrandsQuery } from 'api/brandSlice';
import { useAddProductMutation } from 'api/productSlice';
import Swal from 'sweetalert2';
import { useGetPharmaciesQuery } from 'api/pharmacySlice';
import { useAddFileMutation } from 'api/filesSlice';
import { useGetTypesQuery } from 'api/typeSlice';

const AddProduct = () => {
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [pharmacyId, setPharmacyId] = useState('');
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

  const [addProduct, { isLoading }] = useAddProductMutation();
  const toast = useToast();
  const navigate = useNavigate();

  // Fetch data
  const { data: categoriesResponse } = useGetCategoriesQuery({
    page: 1,
    limit: 1000,
  });
  const { data: variantsResponse } = useGetVarientsQuery({
    page: 1,
    limit: 1000,
  });
  const { data: brandsResponse } = useGetBrandsQuery({ page: 1, limit: 1000 });
  const { data: PharmacyResponse } = useGetPharmaciesQuery({
    page: 1,
    limit: 1000,
  });
  const { data: productTypesResponse } = useGetTypesQuery({ page: 1, limit: 1000 }); // Fetch product types
  
  const categories = categoriesResponse?.data?.data || [];
  const variants = variantsResponse?.data || [];
  const brands = brandsResponse?.data || [];
  const pharmacies = PharmacyResponse?.data?.items || [];
  const productTypes = productTypesResponse?.data?.items || []; // Get product types from response
  
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const [addFile] = useAddFileMutation();

  const cardBg = useColorModeValue('white', 'gray.800');
  const cardShadow = useColorModeValue('md', 'dark-lg');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const uploadBg = useColorModeValue('gray.50', 'gray.700');
  const uploadDragBg = useColorModeValue('blue.50', 'blue.900');

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
            isMain: images.length === 0,
          };
        })
        .filter((img) => img !== null);

      setImages([...images, ...newImages]);
      if (images.length === 0 && newImages.length > 0) {
        setMainImageIndex(0);
      }
    }
  };

  const handleRemoveImage = (index) => {
    URL.revokeObjectURL(images[index].preview);
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    if (mainImageIndex === index) {
      setMainImageIndex(0);
    } else if (mainImageIndex > index) {
      setMainImageIndex(mainImageIndex - 1);
    }
  };

  const handleSetMainImage = (index) => {
    setMainImageIndex(index);
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

      // Upload variant images if they exist
      const variantsWithImages = await Promise.all(
        selectedAttributes.map(async (attr) => {
          if (attr.image) {
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
          return attr;
        }),
      );

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
        };
      });

      // Prepare product data
      if (!price) {
        throw new Error('Price is required for the product.');
      }
      const productData = {
        name: nameEn || undefined,
        description: descriptionEn || undefined,
        categoryId: categoryId || undefined,
        brandId: brandId || undefined,
        pharmacyId: JSON.parse(localStorage.getItem('pharmacy')).id,
        productTypeId: productTypeId || undefined, // Add product type to the request
        cost: cost === null ? undefined : parseFloat(cost),
        price: parseFloat(price),
        quantity: quantity === null ? undefined : parseInt(quantity),
        offerType:
          offerType === null
            ? undefined
            : offerType.toUpperCase().replace(' ', '_'),
        offerPercentage:
          offerPercentage != null ? parseFloat(offerPercentage) : null,
        hasVariants,
        isActive,
        isPublished,
        translations: translations.filter((t) => t.name && t.description),
        images: uploadedImages,
        variants: hasVariants ? variantsData : undefined,
      };

      // Remove any keys that are null
      Object.keys(productData).forEach((key) => {
        if (productData[key] == null || productData[key] === undefined) {
          delete productData[key];
        }
      });

      // Submit to API
      const response = await addProduct(productData).unwrap();

      toast({
        title: 'Success',
        description: 'Product created successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      navigate('/admin/products');
    } catch (err) {
      toast({
        title: 'Error',
        description:
          err.data?.message || err.message || 'Failed to create product',
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

  return (
    <Flex direction="column" align="center" w="100%" mt={20}>
      <Box bg={cardBg} boxShadow={cardShadow} borderRadius="lg" borderWidth="1px" borderColor={borderColor} p={6} w="100%" maxW="1200px">
        <Flex mb={3} justify="space-between" align="center">
          <Text
            color={textColor}
            fontSize="22px"
            fontWeight="700"
            mb="20px !important"
            lineHeight="100%"
          >
            Add New Product
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
                  color={textColor}
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
                  color={textColor}
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
                />
              </FormControl>
            </Box>
          </SimpleGrid>

          {/* Category, Brand, Pharmacy and Product Type */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
            <Box>
              <FormControl isRequired>
                <FormLabel>Category</FormLabel>
                <Select
                  placeholder="Select Category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
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
              <FormControl>
                <FormLabel>Pharmacy</FormLabel>
                <Select
                  placeholder="Select Pharmacy"
                  value={pharmacyId}
                  onChange={(e) => setPharmacyId(e.target.value)}
                >
                  {pharmacies?.map((pharmacy) => (
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

          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4} mb={4}>
            <Box>
              <FormControl isRequired>
                <FormLabel>Cost</FormLabel>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
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
                />
              </FormControl>
            </Box>
            <Box>
              <FormControl isRequired>
                <FormLabel>Quantity</FormLabel>
                <Input
                  type="number"
                  placeholder="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </FormControl>
            </Box>
            <Box>
              <FormControl isRequired>
                <FormLabel>SKU</FormLabel>
                <Input
                  type="number"
                  placeholder="0"
                />
              </FormControl>
            </Box>
          </SimpleGrid>

          {/* Offer Type */}
          <Box mb={4}>
            <FormLabel>Offer Type</FormLabel>
            <RadioGroup value={offerType} onChange={setOfferType}>
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
                  />
                </FormControl>
              </Box>
            )}
          </Box>

          {/* Status Switches */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
          <FormControl display="flex" alignItems="center">
              <FormLabel mb="0">Published</FormLabel>
              <Switch
                isChecked={isPublished}
                onChange={() => setIsPublished(!isPublished)}
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
              <FormLabel mb="0">Has Variants</FormLabel>
              <Switch
                isChecked={hasVariants}
                onChange={() => setHasVariants(!hasVariants)}
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
                            aria-label="Delete variant"
                            size="sm"
                            colorScheme="red"
                            onClick={() => handleDeleteAttribute(index)}
                          />
                        </Flex>
                      </CardHeader>
                      <CardBody>
                        <SimpleGrid columns={2} spacing={2}>
                          <FormControl isRequired>
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
                            />
                          </FormControl>
                          <FormControl isRequired>
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
                            />
                          </FormControl>
                          <FormControl>
                            <FormLabel>Variant Image</FormLabel>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  if (
                                    !e.target.files[0].type.startsWith('image/')
                                  ) {
                                    toast({
                                      title: 'Error',
                                      description:
                                        'Please upload only image files',
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
                            />
                            {attr.image && (
                              <Image
                                src={URL.createObjectURL(attr.image)}
                                alt="Variant preview"
                                mt={2}
                                maxH="100px"
                              />
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
            <FormControl isRequired={images.length === 0}>
              <FormLabel>
                Product Images{' '}
                {images.length === 0 && <span style={{ color: 'red' }}>*</span>}
              </FormLabel>
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

            {images.length > 0 && (
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mt={4}>
                {images.map((img, index) => (
                  <Box key={index} position="relative">
                    <Image
                      src={img.preview}
                      alt={`Product image ${index + 1}`}
                      borderRadius="md"
                      border={
                        mainImageIndex === index ? '2px solid' : '1px solid'
                      }
                      borderColor={
                        mainImageIndex === index ? 'blue.500' : 'gray.200'
                      }
                      cursor="pointer"
                      onClick={() => handleSetMainImage(index)}
                    />
                    {mainImageIndex === index && (
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
                      onClick={() => handleRemoveImage(index)}
                    />
                  </Box>
                ))}
              </SimpleGrid>
            )}
          </Box>
          {/* Submit Buttons */}
          <Flex justify="flex-end" gap={4}>
            <Button variant="outline" colorScheme="red" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" colorScheme="blue" isLoading={isLoading}>
              Save Product
            </Button>
          </Flex>
        </form>
      </Box>
    </Flex>
  );
};

export default AddProduct;