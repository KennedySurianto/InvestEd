import { useState, useEffect } from "react";
import AuthHeader from "@/components/AuthHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { User } from "@/models/User";
import { useToast } from "@/hooks/useToast";

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showToast } = useToast();
    
  // State to hold form data during editing
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
    });

    // Fetch initial profile data on component mount
    useEffect(() => {
        const fetchProfile = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Authentication failed.");

            const response = await fetch("http://localhost:3000/api/users/profile", {
            headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error("Failed to fetch profile data.");
            
            const userData: User = await response.json();
            setUser(userData);
            setFormData({
            full_name: userData.full_name,
            email: userData.email,
            });
        } catch (err: any) {
            showToast({ title: "Error", description: err.message, type: "error" });
        } finally {
            setIsLoading(false);
        }
        };
        fetchProfile();
    }, []);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleCancel = () => {
        if (user) {
        setFormData({ full_name: user.full_name, email: user.email });
        }
        setIsEditMode(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Prepare the request body with snake_case keys as expected by the backend
        const changes: { full_name?: string; email?: string } = {};
        if (formData.full_name !== user?.full_name) {
        changes.full_name = formData.full_name;
        }
        if (formData.email !== user?.email) {
        changes.email = formData.email;
        }

        if (Object.keys(changes).length === 0) {
        setIsEditMode(false);
        setIsSubmitting(false);
        return;
        }

        try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:3000/api/users/profile", {
            method: "PUT",
            headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify(changes),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "An error occurred.");
        
        setUser(result.user);
        setIsEditMode(false);

        showToast({ title: "Success", description: result.message, type: "success" });
        } catch (err: any) {
        showToast({ title: "Error", description: err.message, type: "error" });
        } finally {
        setIsSubmitting(false);
        }
    };

    // Derived state to check if any data has changed
    const hasChanges = isEditMode && (formData.full_name !== user?.full_name || formData.email !== user?.email);

    if (isLoading) {
        return (
        <>
            <AuthHeader />
            <main className="mx-auto max-w-5xl px-4 py-8">
            <h1 className="text-2xl font-semibold mb-6">Profile</h1>
            <div className="rounded-lg border bg-card p-6 space-y-6">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-full" />
            </div>
            </main>
        </>
        )
    }

    if (!user) {
        return <main className="text-center p-8 text-destructive">No user</main>
    }

    return (
        <>
        <AuthHeader />
        <main className="mx-auto max-w-5xl px-4 py-8">
            <h1 className="text-2xl font-semibold">Profile</h1>
            
            <form onSubmit={handleSubmit} className="mt-6 rounded-lg border bg-card">
            <div className="p-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* --- Full Name --- */}
                <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    {isEditMode ? (
                    <Input id="full_name" value={formData.full_name} onChange={handleFormChange} disabled={isSubmitting} />
                    ) : (
                    <p className="text-lg pt-2">{user?.full_name}</p>
                    )}
                </div>
                
                {/* --- Email Address --- */}
                <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    {isEditMode ? (
                    <Input id="email" type="email" value={formData.email} onChange={handleFormChange} disabled={isSubmitting} />
                    ) : (
                    <p className="text-lg pt-2">{user?.email}</p>
                    )}
                </div>

                {/* --- Role --- */}
                <div className="space-y-2">
                    <Label>Role</Label>
                    <p className="text-lg capitalize pt-2">{user?.role}</p>
                </div>

                {/* --- Member Since --- */}
                <div className="space-y-2">
                    <Label>Member Since</Label>
                    <p className="text-lg pt-2">
                    {user ? new Date(user.created_at).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                    </p>
                </div>
                
                {/* --- Membership Status --- */}
                <div className="space-y-2 sm:col-span-2">
                    <Label>Membership Status</Label>
                    {user?.role === "member" ? (
                        <p className="text-lg pt-2 text-green-600 font-semibold">
                            Active Member
                            {user.membership_expires_at === null ? " (Lifetime)" : 
                                ` (Expires on: ${new Date(user.membership_expires_at).toLocaleDateString()})`
                            }
                        </p>
                    ) : (
                        user?.role === "admin" ? (
                            <p className="text-lg pt-2 text-blue-600 font-semibold">Administrator</p>
                        ) : (
                            <p className="text-lg pt-2 text-destructive font-semibold">Not an Active Member</p>
                        )
                    )}
                </div>
                </div>
            </div>
            
            <div className="flex items-center justify-end gap-2 rounded-b-lg border-t bg-muted/50 p-4">
                {isEditMode ? (
                <>
                    <Button variant="ghost" type="button" onClick={handleCancel} disabled={isSubmitting}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting || !hasChanges}>
                    {isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                </>
                ) : (
                <Button type="button" onClick={() => setIsEditMode(true)}>Edit Profile</Button>
                )}
            </div>
            </form>
        </main>
        </>
    );
}