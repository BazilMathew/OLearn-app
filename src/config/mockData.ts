export interface MockContact {
  id: string;
  name: { en: string; hi: string; ml: string };
  relationship: { en: string; hi: string; ml: string };
  phone: string;
  avatarColor: string;
  initial: string;
}

export const MOCK_CONTACTS: MockContact[] = [
  {
    id: 'contact_son_ramesh',
    name: { en: 'Ramesh', hi: 'रमेश', ml: 'രമേഷ്' },
    relationship: { en: 'Son', hi: 'बेटा', ml: 'മകൻ' },
    phone: '+91 98765 43210',
    avatarColor: 'bg-emerald-600',
    initial: 'R'
  },
  {
    id: 'contact_daughter_priya',
    name: { en: 'Priya', hi: 'प्रिया', ml: 'പ്രിയ' },
    relationship: { en: 'Daughter', hi: 'बेटी', ml: 'മകൾ' },
    phone: '+91 98765 12345',
    avatarColor: 'bg-indigo-600',
    initial: 'P'
  },
  {
    id: 'contact_doctor_sharma',
    name: { en: 'Dr. Sharma', hi: 'डॉ. शर्मा', ml: 'ഡോ. ശർമ്മ' },
    relationship: { en: 'Family Doctor', hi: 'फैमिली डॉक्टर', ml: 'ഫാമിലി ഡോക്ടർ' },
    phone: '+91 98111 22334',
    avatarColor: 'bg-blue-600',
    initial: 'S'
  }
];

export interface MockTransaction {
  id: string;
  merchant: { en: string; hi: string; ml: string };
  category: { en: string; hi: string; ml: string };
  date: { en: string; hi: string; ml: string };
  amount: string;
  isCredit: boolean;
  status: 'Completed';
  upiRef: string;
}

export const MOCK_TRANSACTIONS: MockTransaction[] = [
  {
    id: 'history_item_1',
    merchant: { en: 'Sharma Groceries', hi: 'शर्मा किराना', ml: 'ശർമ്മ പലചരക്ക്' },
    category: { en: 'Merchant Payment', hi: 'दुकानदार भुगतान', ml: 'വ്യാപാരി പേയ്മെന്റ്' },
    date: { en: 'Today, 10:30 AM', hi: 'आज, सुबह 10:30', ml: 'ഇന്ന്, രാവിലെ 10:30' },
    amount: '₹320.00',
    isCredit: false,
    status: 'Completed',
    upiRef: 'UPI/428901847192'
  },
  {
    id: 'history_item_2',
    merchant: { en: 'Priya (Daughter)', hi: 'प्रिया (बेटी)', ml: 'പ്രിയ (മകൾ)' },
    category: { en: 'Money Received', hi: 'प्राप्त राशि', ml: 'ലഭിച്ച പണം' },
    date: { en: 'Yesterday', hi: 'कल', ml: 'ഇന്നലെ' },
    amount: '₹2,000.00',
    isCredit: true,
    status: 'Completed',
    upiRef: 'UPI/428766129841'
  },
  {
    id: 'history_item_3',
    merchant: { en: 'Electricity Bill', hi: 'बिजली बिल', ml: 'വൈദ്യുതി ബിൽ' },
    category: { en: 'Bill Payment', hi: 'बिल भुगतान', ml: 'ബിൽ പേയ്മെന്റ്' },
    date: { en: '2 Sep 2026', hi: '2 सित 2026', ml: '2 സെപ്റ്റം 2026' },
    amount: '₹850.00',
    isCredit: false,
    status: 'Completed',
    upiRef: 'UPI/428119283741'
  }
];

export const MOCK_BANK_BALANCE = {
  bankName: 'State Bank of India',
  accountNumberMasked: '•••• •••• 4829',
  balanceAmount: '₹14,250.00',
  asOf: 'Today'
};
