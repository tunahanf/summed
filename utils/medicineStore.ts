import AsyncStorage from '@react-native-async-storage/async-storage';
import { Medicine } from '../models/medicine';

const MEDICINES_STORAGE_KEY = 'user_medicines';

export const MedicineStore = {
  async getMedicines(): Promise<Medicine[]> {
    try {
      const medicinesJson = await AsyncStorage.getItem(MEDICINES_STORAGE_KEY);
      return medicinesJson ? JSON.parse(medicinesJson) : [];
    } catch (error) {
      console.error('Error fetching medicines:', error);
      return [];
    }
  },

  async saveMedicine(medicine: Medicine): Promise<boolean> {
    try {
      const medicines = await this.getMedicines();
      const existingIndex = medicines.findIndex(m => m.id === medicine.id);
      
      if (existingIndex >= 0) {
        medicines[existingIndex] = medicine;
      } else {
        medicines.push(medicine);
      }
      
      await AsyncStorage.setItem(MEDICINES_STORAGE_KEY, JSON.stringify(medicines));
      return true;
    } catch (error) {
      console.error('Error saving medicine:', error);
      return false;
    }
  },

  async deleteMedicine(medicineId: string): Promise<boolean> {
    try {
      const medicines = await this.getMedicines();
      const updatedMedicines = medicines.filter(m => m.id !== medicineId);
      
      await AsyncStorage.setItem(MEDICINES_STORAGE_KEY, JSON.stringify(updatedMedicines));
      return true;
    } catch (error) {
      console.error('Error deleting medicine:', error);
      return false;
    }
  }
}; 