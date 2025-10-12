import React, { useCallback, useState } from 'react';
import { BaseSlider } from '../../../shared/components/common/BaseSlider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../shared/components/ui/table';
import type { AssignmentItem } from '../types';
import { Button } from '../../../shared/components/ui/button';
import { getUserFullName } from "../../../shared/utils/utils.ts";
import { SquarePen, Trash } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { deleteAssignmentAction, toggleEditAssignmentFormAction } from "../actions.ts";
import ConfirmDialog from "../../../shared/components/common/ConfirmDialog.tsx";
import { getEditAssignmentFormSelector } from "../selectors.ts";
import EditAssignmentSlider from "./EditAssignmentSlider.tsx";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  items: Array<AssignmentItem>;
}

const ViewAssignmentDetailsSlider: React.FC<Props> = ({ isOpen, onClose, items }) => {
    const dispatch = useDispatch();
    const [confirmState, setConfirmState] = useState<{open: boolean; item: AssignmentItem | null}>({ open: false, item: null });
    const editForm = useSelector(getEditAssignmentFormSelector);

    const requestDelete = useCallback((item: AssignmentItem) => {
    setConfirmState({ open: true, item });
    }, [])

    const confirmDelete = useCallback(() => {
        if (!confirmState.item) return;

        const payload= {
          userId: confirmState.item.user.id,
          serviceId: confirmState.item.service.id,
        }
        dispatch(deleteAssignmentAction.request(payload));
        setConfirmState({ open: false, item: null });
    }, [dispatch, confirmState])

    const handleEditAssignment = useCallback((item: AssignmentItem) => {
        dispatch(toggleEditAssignmentFormAction({ open: true, item: item }));
    }, [dispatch])

    const handleCloseEditForm = useCallback(() => {
        dispatch(toggleEditAssignmentFormAction({ open: false, item: null }));
    }, [dispatch])

  return (
    <BaseSlider
      isOpen={isOpen}
      onClose={onClose}
      title="Assignment Details"
      contentClassName="bg-muted/50 overflow-auto"
      footer={
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      }
    >
      <div className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Custom Duration</TableHead>
              <TableHead>Custom Price</TableHead>
              <TableHead>Delete</TableHead>
              <TableHead>Edit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.id}</TableCell>
                <TableCell>{item.service?.name ?? item.service?.id}</TableCell>
                <TableCell>{getUserFullName(item.user)}</TableCell>
                <TableCell>{item.customDuration ?? '-'}</TableCell>
                <TableCell>{item.customPrice ?? '-'}</TableCell>
                 <TableCell>
                   <Trash onClick={() => requestDelete(item)} />
                 </TableCell>
                <TableCell>
                  <SquarePen onClick={() => {
                    handleEditAssignment(item)
                  }}/>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">No items</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <ConfirmDialog
          open={confirmState.open}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmState({ open: false, item: null })}
          title={'Delete assignment?'}
          description={'This action cannot be undone. The selected user will be unassigned from this service.'}
      />
      <EditAssignmentSlider
          isOpen={editForm.open}
          item={editForm.item}
          onClose={handleCloseEditForm}
      />
    </BaseSlider>
  );
};

export default ViewAssignmentDetailsSlider;


