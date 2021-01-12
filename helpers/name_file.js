export function NameFile() {
    let date = new Date();

    let year = date.getFullYear();
    let month = date.getMonth()+1;
    if (month < 10) month = '0' + month;
    let day = date.getDate();
    if (day < 10) day = '0' + day;

    let name = `${day}.${month}.${year}`;

    return name;
}