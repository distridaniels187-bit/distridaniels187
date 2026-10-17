const DEFAULT_PAGE_SIZE = 1000;

export const fetchAllRows = async (buildQuery, pageSize = DEFAULT_PAGE_SIZE) => {
  let from = 0;
  const allRows = [];

  while (true) {
    const { data, error } = await buildQuery().range(from, from + pageSize - 1);

    if (error) throw error;

    const batch = data || [];
    allRows.push(...batch);

    if (batch.length < pageSize) break;
    from += pageSize;
  }

  return allRows;
};
