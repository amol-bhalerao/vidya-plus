import React from 'react';
import GenericMasterData from '../GenericMasterData';

const ExpenseCategoriesData = ({ instituteId }) => {
  const expenseCategoryColumns = [
    { accessorKey: 'category_name', header: 'Category Name' },
    { accessorKey: 'description', header: 'Description' },
  ];

  const expenseCategoryFields = [
    { name: 'category_name', label: 'Category Name', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'text' },
  ];

  return (
    <GenericMasterData
      tableName="expense_categories"
      title="Expense Categories"
      description="Manage categories for institutional expenses."
      columns={expenseCategoryColumns}
      formFields={expenseCategoryFields}
      instituteId={instituteId}
    />
  );
};

export default ExpenseCategoriesData;