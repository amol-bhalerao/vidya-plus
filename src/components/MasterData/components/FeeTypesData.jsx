import React from 'react';
import GenericMasterData from '../GenericMasterData';
import MasterFeeAssignment from './MasterFeeAssignment';

const FeeTypesData = ({ instituteId }) => {
  const feeTypeColumns = [
    { accessorKey: 'fee_name', header: 'Fee Name' },
    { accessorKey: 'description', header: 'Description' },
    { accessorKey: 'default_amount', header: 'Default Amount' },
  ];

  const feeTypeFields = [
    { name: 'fee_name', label: 'Fee Name', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'text' },
    { name: 'default_amount', label: 'Default Amount (for misc fees)', type: 'number' },
  ];

  return (
    <>
      <GenericMasterData
        tableName="fee_types"
        title="Fee Types"
        description="Manage individual fee components (e.g., Tuition, Library)."
        columns={feeTypeColumns}
        formFields={feeTypeFields}
        instituteId={instituteId}
        orderBy="fee_name"
      />
      <MasterFeeAssignment instituteId={instituteId} />
    </>
  );
};

export default FeeTypesData;