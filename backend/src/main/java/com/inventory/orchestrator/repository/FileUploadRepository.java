package com.inventory.orchestrator.repository;

import com.inventory.orchestrator.entity.FileUpload;
import com.inventory.orchestrator.entity.FileType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FileUploadRepository extends JpaRepository<FileUpload, Long> {
    
    List<FileUpload> findByFileType(FileType fileType);
    
    List<FileUpload> findByValid(Boolean valid);
}
