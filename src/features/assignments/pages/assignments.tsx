import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppLayout } from '../../../shared/components/layouts/app-layout';
import { Button } from '../../../shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Input } from '../../../shared/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../shared/components/ui/table';
import { Filter, Plus } from 'lucide-react';
import {
  listAssignmentsAction,
  setAssignmentFiltersAction,
  toggleAssignmentFormAction,
  viewAssignmentDetailsAction,
} from '../actions';
import {
  getAssignmentsFiltersSelector,
  getAssignmentsSelector,
  getAssignmentsSummarySelector,
  getAddAssignmentFormSelector,
  getViewDetailsPopupSelector
} from '../selectors';
import type { AssignmentFilterState, AssignmentGroup } from '../types';
import AddAssignmentSlider from "../components/AddAssignmentSlider.tsx";
import { ChartBarDecreasing } from "lucide-react";
import ViewAssignmentDetailsSlider from "../components/ViewAssignmentDetailsSlider.tsx";
import { closeViewDetailsFormAction } from "../actions.ts";

export default function AssignmentsPage() {
  const dispatch = useDispatch();
  const assignments: Array<AssignmentGroup> = useSelector(getAssignmentsSelector);
  const summary = useSelector(getAssignmentsSummarySelector);
  const filters = useSelector(getAssignmentsFiltersSelector);
  const addForm = useSelector(getAddAssignmentFormSelector);
  const viewDetails = useSelector(getViewDetailsPopupSelector);

  const [localSearch, setLocalSearch] = useState(filters.search);
  const [localStatus, setLocalStatus] = useState(filters.status);

  useEffect(() => {
    dispatch(listAssignmentsAction.request());
  }, [dispatch]);

  const applyFilters = () => {
    const next: AssignmentFilterState = { ...filters, search: localSearch, status: localStatus };
    dispatch(setAssignmentFiltersAction.request(next));
  };

  const handleCloseAddForm = () => {
    dispatch(toggleAssignmentFormAction(false))
  }

  const handleOpenViewDetails = useCallback ((serviceId: number) => {
    dispatch(viewAssignmentDetailsAction.request({ serviceId }))
  },[dispatch])

  const handleCloseViewDetails = useCallback(() => {
    dispatch(closeViewDetailsFormAction())
  }, [dispatch])

  return (
    <AppLayout>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Assignments</h1>
          <Button onClick={() => dispatch(toggleAssignmentFormAction(true))}>
            <Plus className="h-4 w-4 mr-2" />
            Add Assignment
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 items-center">
              <Input placeholder="Search assignments" value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} />
              <select className="border rounded px-2 py-2" value={localStatus} onChange={(e) => setLocalStatus(e.target.value as any)}>
                <option value="all">All</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
              <Button variant="secondary" onClick={applyFilters}>
                <Filter className="h-4 w-4 mr-2" /> Apply
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>List{summary ? ` • ${summary.total} total` : ''}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service Id</TableHead>
                  <TableHead>Service Name</TableHead>
                  <TableHead>Team members</TableHead>
                  <TableHead>View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment: AssignmentGroup) => (
                  <TableRow key={assignment.service.id}>
                    <TableCell>{assignment.service.id}</TableCell>
                    <TableCell>{assignment.service.name}</TableCell>
                    <TableCell>{assignment.assignees.length}</TableCell>
                    <TableCell title={'View Details'}>
                      <ChartBarDecreasing
                          onClick={() => {
                            handleOpenViewDetails(assignment.service.id)
                          }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {assignments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">No assignments</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <AddAssignmentSlider isOpen={addForm.open} onClose={handleCloseAddForm}/>
        <ViewAssignmentDetailsSlider
          isOpen={viewDetails.open}
          onClose={handleCloseViewDetails}
          items={viewDetails.item || []}
        />
      </div>
    </AppLayout>
  );
}


