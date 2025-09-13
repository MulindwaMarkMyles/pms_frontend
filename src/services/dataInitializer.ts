import { 
  useCreateAmenityMutation, 
  useCreateFurnishingMutation,
  useCreateTenantTypeMutation,
  useCreateComplaintStatusMutation
} from './index';
import { useCreatePaymentStatusMutation } from './paymentApi';

// Pre-populate data as per API documentation
export const useDataInitializer = () => {
  const [createAmenity] = useCreateAmenityMutation();
  const [createFurnishing] = useCreateFurnishingMutation();
  const [createTenantType] = useCreateTenantTypeMutation();
  const [createComplaintStatus] = useCreateComplaintStatusMutation();
  const [createPaymentStatus] = useCreatePaymentStatusMutation();

  const initializeAmenities = async () => {
    const amenities = ['Water', 'Electricity', 'Internet', 'Parking', 'Security'];
    
    for (const amenity of amenities) {
      try {
        await createAmenity({ name: amenity }).unwrap();
      } catch (error) {
        console.log(`Amenity ${amenity} may already exist`);
      }
    }
  };

  const initializeFurnishings = async () => {
    const furnishings = [
      'Air Conditioning',
      'Kitchen Appliances', 
      'Bedroom Furniture',
      'Living Room Furniture'
    ];
    
    for (const furnishing of furnishings) {
      try {
        await createFurnishing({ name: furnishing }).unwrap();
      } catch (error) {
        console.log(`Furnishing ${furnishing} may already exist`);
      }
    }
  };

  const initializeTenantTypes = async () => {
    const tenantTypes = [
      'Short Stay (6 months or less)',
      'Long Term Stay (1+ years)',
      'Corporate Tenant'
    ];
    
    for (const type of tenantTypes) {
      try {
        await createTenantType({ name: type }).unwrap();
      } catch (error) {
        console.log(`Tenant type ${type} may already exist`);
      }
    }
  };

  const initializeComplaintStatuses = async () => {
    const statuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
    
    for (const status of statuses) {
      try {
        await createComplaintStatus({ name: status }).unwrap();
      } catch (error) {
        console.log(`Complaint status ${status} may already exist`);
      }
    }
  };

  const initializePaymentStatuses = async () => {
    const statuses = ['Pending', 'Paid', 'Overdue', 'Partial'];
    
    for (const status of statuses) {
      try {
        await createPaymentStatus({ name: status }).unwrap();
      } catch (error) {
        console.log(`Payment status ${status} may already exist`);
      }
    }
  };

  const initializeAllData = async () => {
    console.log('Initializing system data...');
    
    await Promise.all([
      initializeAmenities(),
      initializeFurnishings(),
      initializeTenantTypes(),
      initializeComplaintStatuses(),
      initializePaymentStatuses(),
    ]);

    console.log('System data initialization completed');
  };

  return {
    initializeAmenities,
    initializeFurnishings,
    initializeTenantTypes,
    initializeComplaintStatuses,
    initializePaymentStatuses,
    initializeAllData,
  };
};