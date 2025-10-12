import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "../ui/alert-dialog.tsx";
import React from "react";

interface IProps {
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    cancelTitle?: string
    confirmTitle?: string
    title: string
    description: string
}

const ConfirmDialog: React.FC<IProps> = ({
     open, onConfirm, onCancel, cancelTitle,
    confirmTitle, title,description
}) => {
    return (
        <AlertDialog open={open}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onCancel}>{cancelTitle || `Cancel`}</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>{confirmTitle || `Delete`}</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
export default ConfirmDialog;


