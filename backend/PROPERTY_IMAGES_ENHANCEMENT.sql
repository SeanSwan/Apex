-- APEX AI SECURITY PLATFORM - Property Images Enhancement
-- ========================================================
-- Adds image management capabilities to Properties table
-- Execute this script in pgAdmin connected to 'apex' database

-- Add image-related columns to Properties table
ALTER TABLE "Properties" 
ADD COLUMN IF NOT EXISTS property_images JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS primary_image VARCHAR(500),
ADD COLUMN IF NOT EXISTS image_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS images_last_updated TIMESTAMP WITH TIME ZONE;

-- Add comments for documentation
COMMENT ON COLUMN "Properties".property_images IS 'Array of property image metadata objects with filename, path, uploadDate, description';
COMMENT ON COLUMN "Properties".primary_image IS 'Primary property image filename for thumbnails and main display';
COMMENT ON COLUMN "Properties".image_count IS 'Total number of images uploaded for this property';
COMMENT ON COLUMN "Properties".images_last_updated IS 'Timestamp of the last image upload or modification';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS properties_primary_image_idx ON "Properties"(primary_image);
CREATE INDEX IF NOT EXISTS properties_image_count_idx ON "Properties"(image_count);
CREATE INDEX IF NOT EXISTS properties_images_updated_idx ON "Properties"(images_last_updated);

-- Create uploads directory structure tracking table
CREATE TABLE IF NOT EXISTS "PropertyImageFiles" (
  id SERIAL PRIMARY KEY,
  "propertyId" INTEGER REFERENCES "Properties"(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  width INTEGER,
  height INTEGER,
  is_primary BOOLEAN DEFAULT false,
  description TEXT,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  uploaded_by INTEGER REFERENCES "Users"(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE "PropertyImageFiles" TO swanadmin;
GRANT ALL PRIVILEGES ON SEQUENCE "PropertyImageFiles_id_seq" TO swanadmin;

-- Add indexes for PropertyImageFiles
CREATE INDEX IF NOT EXISTS property_image_files_property_id_idx ON "PropertyImageFiles"("propertyId");
CREATE INDEX IF NOT EXISTS property_image_files_is_primary_idx ON "PropertyImageFiles"(is_primary);
CREATE INDEX IF NOT EXISTS property_image_files_upload_date_idx ON "PropertyImageFiles"(upload_date);

-- Create function to automatically update image_count when images are added/removed
CREATE OR REPLACE FUNCTION update_property_image_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE "Properties" 
    SET image_count = (
      SELECT COUNT(*) FROM "PropertyImageFiles" 
      WHERE "propertyId" = NEW."propertyId"
    ),
    images_last_updated = CURRENT_TIMESTAMP
    WHERE id = NEW."propertyId";
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE "Properties" 
    SET image_count = (
      SELECT COUNT(*) FROM "PropertyImageFiles" 
      WHERE "propertyId" = OLD."propertyId"
    ),
    images_last_updated = CURRENT_TIMESTAMP
    WHERE id = OLD."propertyId";
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically maintain image count
DROP TRIGGER IF EXISTS property_image_count_trigger ON "PropertyImageFiles";
CREATE TRIGGER property_image_count_trigger
  AFTER INSERT OR DELETE ON "PropertyImageFiles"
  FOR EACH ROW EXECUTE FUNCTION update_property_image_count();

-- Success message
SELECT 'Property images enhancement completed successfully!' AS status;
