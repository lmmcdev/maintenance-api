// Test parsing logic for fromText
function parseFromText(fromText) {
  let phoneNumber = undefined;
  let fullName = fromText.trim();
  
  // Check for "Name, (phone)" format
  const commaPhoneMatch = fromText.match(/^(.+?),\s*\(?([0-9\s\-\+\(\)]+)\)?$/);
  if (commaPhoneMatch) {
    fullName = commaPhoneMatch[1].trim();
    // Extract just the digits from the phone number
    phoneNumber = commaPhoneMatch[2].replace(/\D/g, '');
  } else {
    // Try other formats with space-separated parts
    const parts = fromText.trim().split(/\s+/);
    
    if (parts.length >= 3) {
      // Check if first and last parts are the same (likely phone number)
      const firstPart = parts[0];
      const lastPart = parts[parts.length - 1];
      
      if (firstPart === lastPart && /^\d+$/.test(firstPart)) {
        phoneNumber = firstPart;
        // Extract name (everything between first and last phone number)
        fullName = parts.slice(1, -1).join(' ');
      } else if (/^\d+$/.test(firstPart)) {
        // First part is a number, treat it as phone
        phoneNumber = firstPart;
        fullName = parts.slice(1).join(' ');
      }
    } else if (parts.length > 0 && /^\d+$/.test(parts[0])) {
      // First part is phone number
      phoneNumber = parts[0];
      fullName = parts.slice(1).join(' ') || 'Unknown';
    }
  }
  
  return { phoneNumber, fullName };
}

// Test cases
const testCases = [
  "TAPIA SALVADON, (786) 651-6455",
  "John Smith, 555-123-4567",
  "Maria Garcia, (305) 987-6543",
  "5638 Esteban Ulloa 5638",
  "1234 John Doe",
  "9999 Maria Garcia Lopez 9999",
  "Roberto Martinez",
  "7777",
  ""
];

console.log("Testing fromText parsing:\n");
testCases.forEach(test => {
  const result = parseFromText(test);
  console.log(`Input: "${test}"`);
  console.log(`  Phone: ${result.phoneNumber || 'undefined'}`);
  console.log(`  Name: ${result.fullName}\n`);
});