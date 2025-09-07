import React, { useState, useEffect } from 'react';
import { AppLayout } from '../shared/components/layouts/app-layout';
import { Button } from '../shared/components/ui/button';
import { Input } from '../shared/components/ui/input';
import { Label } from '../shared/components/ui/label';
import { Textarea } from '../shared/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../shared/components/ui/tabs';
import { Switch } from '../shared/components/ui/switch';
import { X, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface WorkingHours {
  day: string;
  isWorking: boolean;
  startTime: string;
  endTime: string;
}

interface PortfolioImage {
  id: string;
  url: string;
  caption: string;
}

interface TeamMemberProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  about: string;
  workingHours: WorkingHours[];
  portfolioImages: PortfolioImage[];
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    about: '',
    workingHours: [
      { day: 'Monday', isWorking: true, startTime: '09:00', endTime: '17:00' },
      { day: 'Tuesday', isWorking: true, startTime: '09:00', endTime: '17:00' },
      { day: 'Wednesday', isWorking: true, startTime: '09:00', endTime: '17:00' },
      { day: 'Thursday', isWorking: true, startTime: '09:00', endTime: '17:00' },
      { day: 'Friday', isWorking: true, startTime: '09:00', endTime: '17:00' },
      { day: 'Saturday', isWorking: false, startTime: '09:00', endTime: '17:00' },
      { day: 'Sunday', isWorking: false, startTime: '09:00', endTime: '17:00' },
    ],
    portfolioImages: []
  });
  const [newImage, setNewImage] = useState<File | null>(null);
  const [newImageCaption, setNewImageCaption] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    // Clean up preview URL when component unmounts
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/team-member/profile');
      const data = await response.json();
      setProfile(data);
    } catch (error) {
      // Fallback to mock data for development
      console.error('Error fetching profile:', error);
      // Profile already initialized with default values
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/team-member/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (!response.ok) throw new Error('Failed to update profile');

      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleWorkingHoursChange = (index: number, field: keyof WorkingHours, value: any) => {
    const updatedHours = [...profile.workingHours];
    updatedHours[index] = {
      ...updatedHours[index],
      [field]: value,
    };
    setProfile({ ...profile, workingHours: updatedHours });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewImage(file);
      
      // Create preview URL
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);
    }
  };

  const handleAddImage = async () => {
    if (!newImage) return;

    try {
      // In a real app, you would upload the image to a server/storage
      // and get back a URL. Here we're just simulating that.
      const formData = new FormData();
      formData.append('image', newImage);
      formData.append('caption', newImageCaption);

      const response = await fetch('/api/team-member/portfolio', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload image');

      const data = await response.json();
      
      // Add the new image to the portfolio
      setProfile({
        ...profile,
        portfolioImages: [
          ...profile.portfolioImages,
          {
            id: data.id || `temp-${Date.now()}`,
            url: data.url || URL.createObjectURL(newImage),
            caption: newImageCaption
          }
        ]
      });

      // Reset form
      setNewImage(null);
      setNewImageCaption('');
      setPreviewUrl(null);
      
      toast.success('Image added to portfolio');
    } catch (error) {
      toast.error('Failed to add image to portfolio');
    }
  };

  const handleRemoveImage = async (id: string) => {
    try {
      const response = await fetch(`/api/team-member/portfolio/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove image');

      // Remove the image from the portfolio
      setProfile({
        ...profile,
        portfolioImages: profile.portfolioImages.filter((img: any) => img.id !== id)
      });
      
      toast.success('Image removed from portfolio');
    } catch (error) {
      toast.error('Failed to remove image from portfolio');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto py-10">
          <div className="flex flex-col space-y-4 items-center justify-center min-h-[60vh]">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Personal Profile</h1>
          <Button onClick={handleSaveProfile} disabled={saving}>
            {saving ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        <Tabs defaultValue="personal" className="space-y-4">
          <TabsList>
            <TabsTrigger value="personal">Personal Information</TabsTrigger>
            <TabsTrigger value="hours">Working Hours</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details here. This information will be visible to clients.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profile.firstName}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profile.lastName}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="about">About</Label>
                  <Textarea
                    id="about"
                    placeholder="Tell clients about yourself, your experience, and your services..."
                    className="min-h-[150px]"
                    value={profile.about}
                    onChange={(e) => setProfile({ ...profile, about: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hours" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Working Hours</CardTitle>
                <CardDescription>
                  Set your availability for each day of the week.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profile.workingHours.map((day: any, index: number) => (
                    <div key={day.day} className="flex items-center space-x-4">
                      <div className="w-28">
                        <span className="font-medium">{day.day}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={day.isWorking}
                          onCheckedChange={(checked) => 
                            handleWorkingHoursChange(index, 'isWorking', checked)
                          }
                        />
                        <span>{day.isWorking ? 'Working' : 'Not Working'}</span>
                      </div>
                      {day.isWorking && (
                        <>
                          <div className="flex items-center space-x-2">
                            <span>From</span>
                            <Input
                              type="time"
                              className="w-32"
                              value={day.startTime}
                              onChange={(e) => 
                                handleWorkingHoursChange(index, 'startTime', e.target.value)
                              }
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <span>To</span>
                            <Input
                              type="time"
                              className="w-32"
                              value={day.endTime}
                              onChange={(e) => 
                                handleWorkingHoursChange(index, 'endTime', e.target.value)
                              }
                            />
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio</CardTitle>
                <CardDescription>
                  Add images to showcase your work to potential clients.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-8 border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Add New Image</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="portfolioImage">Image</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="portfolioImage"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="flex-1"
                        />
                        {newImage && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setNewImage(null);
                              setPreviewUrl(null);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="imageCaption">Caption (optional)</Label>
                      <Input
                        id="imageCaption"
                        value={newImageCaption}
                        onChange={(e) => setNewImageCaption(e.target.value)}
                        placeholder="Describe this work"
                      />
                    </div>
                  </div>

                  {previewUrl && (
                    <div className="mt-4">
                      <p className="text-sm mb-2">Preview:</p>
                      <div className="relative h-40 w-full sm:w-64 rounded-md overflow-hidden">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="object-cover w-full h-full"
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <Button onClick={handleAddImage} disabled={!newImage}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add to Portfolio
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {profile.portfolioImages.map((image: any) => (
                    <div
                      key={image.id}
                      className="relative group rounded-lg overflow-hidden border"
                    >
                      <div className="aspect-square relative">
                        <img
                          src={image.url}
                          alt={image.caption || "Portfolio image"}
                          className="object-cover w-full h-full"
                        />
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleRemoveImage(image.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {image.caption && (
                        <div className="p-2 bg-background">
                          <p className="text-sm truncate">{image.caption}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {profile.portfolioImages.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No portfolio images yet. Add some to showcase your work!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
