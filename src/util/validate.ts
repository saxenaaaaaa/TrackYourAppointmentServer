export function dateValidator(date: string) {
    // validates that the date string is in DD/MM/YYYY format and is a valid date;
    let dateArray = date.split("/");
    if(dateArray.length == 3) {
        let dateInStandardFormat = `${dateArray[2]}-${dateArray[1]}-${dateArray[0]}`; // format the date in YYYY-MM-DD format
        return !isNaN(Date.parse(dateInStandardFormat));
    } 
    return false;
}