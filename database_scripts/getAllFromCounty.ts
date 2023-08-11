export const getCounty = async function (prisma: any, county: string) {
  const rows = await prisma[county].findMany();
  // Iterate over the rows and create objects for each column
  let countyData: any = [];
  rows.forEach((row: any) => {
    const column = {
      id: row.id,
      appliedDate: row.appliedDate,
      requestedDate: row.requestedDate,
      inspectedDate: row.inspectedDate,
      owner: row.owner,
      address: row.address,
      city: row.city,
      county: row.county,
      status: row.status,
      description: row.description,
    };
    countyData.push(column);
  });

  return countyData;
};
