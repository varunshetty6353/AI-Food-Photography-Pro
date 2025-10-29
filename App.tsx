import React, { useState, useCallback, useMemo } from 'react';
import FormFieldComponent from './components/FormField';
import { generateImage } from './services/geminiService';
import type { FormData, FormField } from './types';

const CameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const UploadIcon = () => (
    <svg className="w-10 h-10 mb-3 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
    </svg>
);


const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-400"></div>
        <p className="text-indigo-300">Re-creating your masterpiece...</p>
    </div>
);

const formFields: FormField[] = [
  { id: 'photo_style', label: 'Photography Style', description: 'The overall lighting and feel of the shot.', type: 'select', options: ['Natural light', 'Studio lighting', 'Moody tone', 'Bright & airy', 'Minimalist', 'Rustic', 'Cinematic', 'Vintage film', 'Gourmet magazine', 'High contrast'], defaultValue: 'Natural light' },
  { id: 'background', label: 'Background', description: 'The surface or setting for the dish.', type: 'select', options: ['Wooden table', 'Marble surface', 'Dark textured background', 'Plain pastel color', 'Restaurant setup', 'Outdoor daylight'], defaultValue: 'Wooden table' },
  { id: 'angle', label: 'Camera Angle', description: 'The perspective from which the photo is taken.', type: 'select', options: ['Top-down (flat lay)', '45-degree angle', 'Eye-level shot'], defaultValue: '45-degree angle' },
  { id: 'color_tone', label: 'Color Tone & Mood', description: 'The color cast that influences the mood.', type: 'select', options: ['Warm tones', 'Cool tones', 'Neutral tones'], defaultValue: 'Warm tones' },
  { id: 'depth_of_field', label: 'Depth of Field', description: 'How much of the background is in focus.', type: 'select', options: ['Shallow depth (blurred background)', 'Deep focus (everything sharp)'], defaultValue: 'Shallow depth (blurred background)' },
  { id: 'props', label: 'Props (Optional)', description: 'Mention optional props like cutlery, napkins, herbs, etc.', type: 'textarea', placeholder: 'e.g., A silver fork, a white linen napkin, and a few scattered fresh herbs.', defaultValue: 'Cutlery, napkin, lemon slices' },
  { id: 'output_type', label: 'Output Intent', description: 'The intended use for the final image.', type: 'select', options: ['Social media post', 'Menu image', 'Advertisement', 'Website hero image'], defaultValue: 'Menu image' },
];

const PREDEFINED_INSPIRATIONS = [
  'A swirl of balsamic glaze',
  'Scattered fresh herbs',
  'A side of lemon wedges',
  'Dusted with powdered sugar',
  'A dollop of cream',
  'Elegant silver cutlery',
  'A rustic linen napkin',
  'Splashes of olive oil',
  'Toasted sesame seeds',
  'A sprinkle of chili flakes'
];

type UploadedFile = { data: string; name: string };

const App: React.FC = () => {
  const initialFormData: FormData = useMemo(() => formFields.reduce((acc, field) => {
    acc[field.id] = field.defaultValue;
    return acc;
  }, {} as FormData), []);

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<UploadedFile[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleFileChange = useCallback((files: FileList | null) => {
      if (!files) return;
      const fileArray = Array.from(files);
      const newImages: UploadedFile[] = [];
      let loadedCount = 0;

      if (fileArray.length === 0) return;

      fileArray.forEach(file => {
          const reader = new FileReader();
          reader.onload = (event) => {
              if (event.target && typeof event.target.result === 'string') {
                  newImages.push({ data: event.target.result, name: file.name });
              }
              loadedCount++;
              if (loadedCount === fileArray.length) {
                  setUploadedImages(prev => [...prev, ...newImages]);
              }
          };
          reader.onerror = () => {
              loadedCount++;
              if (loadedCount === fileArray.length) {
                  setUploadedImages(prev => [...prev, ...newImages]);
              }
          };
          // Fix: Corrected typo `readDataURL` to `readAsDataURL`
          reader.readAsDataURL(file);
      });
  }, []);

  const removeImage = useCallback((indexToRemove: number) => {
    const imageToRemove = uploadedImages[indexToRemove];
    if (imageToRemove?.data === selectedImage) {
        setSelectedImage(null);
    }
    setUploadedImages(prev => prev.filter((_, index) => index !== indexToRemove));
  }, [uploadedImages, selectedImage]);

  const handleApplyInspiration = useCallback((idea: string) => {
    setFormData(prev => {
      const currentProps = prev.props.trim();
      const newProps = currentProps ? `${currentProps}, ${idea}` : idea.charAt(0).toUpperCase() + idea.slice(1);
      return { ...prev, props: newProps };
    });
  }, []);

  const createPrompt = (data: FormData): string => {
      return `Style: ${data.photo_style} on a ${data.background} with a ${data.angle}. 
      The mood is set by ${data.color_tone} and a ${data.depth_of_field}. 
      Subtle props include ${data.props || 'none'}. 
      The image is high-resolution, photorealistic, and suitable for a ${data.output_type}.`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedImage) {
        setError("Please upload and select an image to re-create.");
        return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    
    const prompt = createPrompt(formData);
    setGeneratedPrompt(prompt);

    try {
      const imageUrl = await generateImage(prompt, selectedImage);
      setGeneratedImage(imageUrl);
    } catch (err: any) {
      setError(err?.message || 'Failed to re-create image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const propsFieldIndex = formFields.findIndex(f => f.id === 'props');
  const fieldsBeforeProps = formFields.slice(0, propsFieldIndex);
  const propsField = formFields[propsFieldIndex];
  const fieldsAfterProps = formFields.slice(propsFieldIndex + 1);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <main className="container mx-auto p-4 md:p-8">
        <header className="text-center mb-8 md:mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
            AI Food Photography Pro
          </h1>
          <p className="mt-3 text-lg text-gray-400 max-w-2xl mx-auto">
            Upload your food photo and use the options below to re-create it with a professional touch.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Form */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700">
            <div className="mb-6">
              <label className="block text-sm font-medium text-indigo-300 mb-2">1. Upload Your Image</label>
              <div 
                  className="flex items-center justify-center w-full"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); handleFileChange(e.dataTransfer.files); }}
              >
                  <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700/50 hover:bg-gray-700 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <UploadIcon />
                          <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                          <p className="text-xs text-gray-500">PNG, JPG or WEBP</p>
                      </div>
                      <input id="dropzone-file" type="file" className="hidden" multiple accept="image/png, image/jpeg, image/webp" onChange={(e) => handleFileChange(e.target.files)} />
                  </label>
              </div>
              {uploadedImages.length > 0 && (
                  <div className="mt-4">
                      <p className="text-xs text-gray-400 mb-2">Select an image to re-create:</p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                          {uploadedImages.map((image, index) => (
                              <div key={index} className="relative group">
                                  <img 
                                      src={image.data} 
                                      alt={image.name} 
                                      className={`w-full h-full object-cover rounded-md cursor-pointer aspect-square transition-all ${selectedImage === image.data ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-gray-800' : 'opacity-70 hover:opacity-100'}`}
                                      onClick={() => setSelectedImage(image.data)}
                                  />
                                  <button onClick={() => removeImage(index)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
            </div>
            
            <form onSubmit={handleSubmit}>
              <label className="block text-sm font-medium text-indigo-300 mb-2">2. Set Your Style</label>
              
              {fieldsBeforeProps.map((field) => (
                <FormFieldComponent
                  key={field.id}
                  field={field}
                  value={formData[field.id]}
                  onChange={handleChange}
                />
              ))}

              <div className="my-6">
                <h3 className="block text-sm font-medium text-indigo-300 mb-1">Styling Ideas</h3>
                <p className="text-xs text-gray-400 mb-2">Click to add common props and garnishes.</p>
                <div className="flex flex-wrap gap-2">
                  {PREDEFINED_INSPIRATIONS.map((idea, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleApplyInspiration(idea)}
                      className="text-xs bg-gray-600 hover:bg-gray-500 text-gray-200 py-1 px-3 rounded-full transition-colors flex items-center gap-1"
                      title={`Add "${idea}" to props`}
                    >
                      <span className="font-bold">+</span>
                      <span>{idea}</span>
                    </button>
                  ))}
                </div>
              </div>

              {propsField && <FormFieldComponent
                  key={propsField.id}
                  field={propsField}
                  value={formData[propsField.id]}
                  onChange={handleChange}
              />}
              
              {fieldsAfterProps.map((field) => (
                <FormFieldComponent
                  key={field.id}
                  field={field}
                  value={formData[field.id]}
                  onChange={handleChange}
                />
              ))}

              <button
                type="submit"
                disabled={isLoading || !selectedImage}
                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? 'Working...' : 'Re-create Image'}
              </button>
            </form>
          </div>

          {/* Right Column: Image Display */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 flex flex-col">
            <div className="flex-grow flex items-center justify-center bg-gray-900/50 rounded-lg aspect-[4/3] w-full relative group">
              {isLoading ? (
                <LoadingSpinner />
              ) : generatedImage ? (
                <>
                  <img src={generatedImage} alt="Generated food" className="w-full h-full object-cover rounded-lg" />
                   <a
                    href={generatedImage}
                    download="ai-food-photo.jpg"
                    className="absolute bottom-4 right-4 bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                    >
                    Download Image
                   </a>
                </>
              ) : error ? (
                <div className="text-center text-red-400 p-4">
                  <h3 className="font-bold mb-2">Operation Failed</h3>
                  <p className="text-sm">{error}</p>
                </div>
              ) : (
                <div className="text-center">
                  <CameraIcon />
                  <p className="mt-2 text-gray-500">Your re-created image will appear here</p>
                </div>
              )}
            </div>
            {generatedPrompt && !isLoading && (
              <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                <h3 className="font-semibold text-sm text-indigo-300 mb-2">Generated Prompt:</h3>
                <p className="text-xs text-gray-300 font-mono leading-relaxed">{generatedPrompt}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;