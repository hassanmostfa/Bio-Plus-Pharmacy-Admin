import React, { useEffect, useState } from "react";
import { Button, Input, Text, useColorModeValue, Spinner, Box } from "@chakra-ui/react";
import Swal from "sweetalert2";
import { useUpdatePharmacyMutation, useGetPharmacyQuery } from "api/pharmacySlice";

const DeliveryFees = () => {
  const [updatePharmacy, { isLoading: isUpdatingPharmacy }] = useUpdatePharmacyMutation();
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const pharmacy = localStorage.getItem('pharmacy');
  const pharmacyId = pharmacy ? JSON.parse(pharmacy).id : null;
  const { data: pharmacyData, isLoading: isFetching, error: fetchError } = useGetPharmacyQuery(pharmacyId);

  const [deliveryFee, setDeliveryFee] = useState("");

  const cardBg = useColorModeValue('white', 'navy.700');
  const inputBg = useColorModeValue('gray.100', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');
  const inputTextColor = useColorModeValue(undefined, 'white');

  useEffect(() => {
    if (pharmacyData) {
      setDeliveryFee(pharmacyData.data.deliveryFee?.toString() || "");
    }
  }, [pharmacyData]);

  const handleInputChange = (e) => {
    setDeliveryFee(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(deliveryFee);
    if (isNaN(amount) || amount < 0) {
      Swal.fire("Validation Error", "Please enter a valid, non-negative delivery fee amount.", "error");
      return;
    }

    try {
      await updatePharmacy({id:pharmacyId,pharmacy:{ deliveryFee: amount }}).unwrap();
      Swal.fire("Success!", "Delivery fee updated successfully.", "success");
    } catch (err) {
      console.error("Error updating delivery fee:", err);
      Swal.fire("Error", "Failed to update delivery fee.", "error");
    }
  };

  if (isFetching) return <Spinner color="blue.500" size="xl" />;
  if (fetchError) return <Text color="red.500">Failed to load pharmacy data. Please try again.</Text>;

  return (
    <div className="container w-100">
      <Box bg={cardBg} borderRadius="lg" borderWidth="1px" borderColor={borderColor} p={6} w="100%" mx="auto">
        <Text color={textColor} fontSize="22px" fontWeight="700" mb="20px !important" lineHeight="100%">
          Delivery Fee Settings
        </Text>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <Text color={textColor} fontSize="sm" fontWeight="700">
              Delivery Fee
              <span style={{ color: 'red', marginLeft: 4 }}>*</span>
            </Text>
            <Input
              type="number"
              name="deliveryFee"
              placeholder="Enter delivery fee amount"
              value={deliveryFee}
              onChange={handleInputChange}
              required
              mt="8px"
              min="0"
              bg={inputBg}
              color={inputTextColor}
            />
          </div>
          <Button
            variant="darkBrand"
            color="white"
            fontSize="sm"
            fontWeight="500"
            borderRadius="70px"
            px="24px"
            py="5px"
            type="submit"
            mt="30px"
            isLoading={isUpdatingPharmacy}
          >
            Save
          </Button>
        </form>
      </Box>
    </div>
  );
};

export default DeliveryFees;
