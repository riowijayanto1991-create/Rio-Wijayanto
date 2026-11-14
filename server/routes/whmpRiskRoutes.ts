import { Router, Request, Response } from 'express';
import { whmpRiskStore } from '../whmpRiskStore';
import { securityDb } from '../security/securityDb';

export const whmpRouter = Router();

/**
 * GET /api/whmp/config
 * Get matrix configuration, zones 1..6, and likelihood threshold settings
 */
whmpRouter.get('/whmp/config', (_req: Request, res: Response) => {
  try {
    const config = whmpRiskStore.getConfig();
    res.json(config);
  } catch (err: any) {
    console.error('Error in GET /api/whmp/config:', err);
    res.status(500).json({ error: 'Gagal memuat konfigurasi model risiko WHMP' });
  }
});

/**
 * PUT /api/whmp/thresholds/approve
 * Formal approval of placeholder thresholds (Requires RiskRules.Edit or SuperAdmin / AirportAdmin)
 */
whmpRouter.put('/whmp/thresholds/approve', (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { remarks } = req.body || {};

    if (!user) {
      return res.status(401).json({ error: 'Diperlukan autentikasi untuk menyetujui ambang batas risiko.' });
    }

    const canEditRules = user.role === 'SuperAdmin' || 
                         user.role === 'AirportAdmin' || 
                         (user.permissions && user.permissions.includes('RiskRules.Edit'));

    if (!canEditRules) {
      return res.status(403).json({ error: 'Hanya peran SuperAdmin, AirportAdmin, atau pemegang hak RiskRules.Edit yang dapat menyetujui ambang batas risiko.' });
    }

    const approverName = `${user.fullName} (${user.role})`;
    const updatedConfig = whmpRiskStore.approveThresholds(approverName, remarks);

    // Audit log
    securityDb.appendAuditLog({
      actorUserId: user.id,
      actorEmail: user.email,
      actorIp: req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1',
      userAgent: (req.headers['user-agent'] as string) || 'WHMS-Client',
      action: 'WHMP_THRESHOLDS_APPROVED',
      entityType: 'RiskConfig',
      entityId: 'thresholds',
      afterValues: { approvedBy: approverName, remarks },
      result: 'SUCCESS'
    });

    res.json({
      message: 'Ambang batas frekuensi risiko WHMP berhasil disahkan resmi.',
      config: updatedConfig
    });
  } catch (err: any) {
    console.error('Error in PUT /api/whmp/thresholds/approve:', err);
    res.status(500).json({ error: 'Gagal menyetujui ambang batas risiko WHMP' });
  }
});

/**
 * GET /api/whmp/species
 * Get species catalog from WHMP Chapter II
 */
whmpRouter.get('/whmp/species', (_req: Request, res: Response) => {
  try {
    const species = whmpRiskStore.getSpeciesCatalog();
    res.json({
      total: species.length,
      species
    });
  } catch (err: any) {
    console.error('Error in GET /api/whmp/species:', err);
    res.status(500).json({ error: 'Gagal memuat katalog spesies WHMP' });
  }
});

/**
 * PATCH /api/whmp/species/:id/taxonomy
 * Update taxonomic review status (Verified / Needs taxonomic review)
 */
whmpRouter.patch('/whmp/species/:id/taxonomy', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, correctedName, notes } = req.body || {};

    if (!status || !['Needs taxonomic review', 'Verified'].includes(status)) {
      return res.status(400).json({ error: 'Status taksonomi harus "Needs taxonomic review" atau "Verified"' });
    }

    const updated = whmpRiskStore.updateTaxonomicStatus(id, status, correctedName, notes);
    if (!updated) {
      return res.status(404).json({ error: 'Spesies tidak ditemukan' });
    }

    const user = (req as any).user;
    if (user) {
      securityDb.appendAuditLog({
        actorUserId: user.id,
        actorEmail: user.email,
        actorIp: req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1',
        userAgent: (req.headers['user-agent'] as string) || 'WHMS-Client',
        action: 'WHMP_SPECIES_TAXONOMY_UPDATED',
        entityType: 'WHMPSpecies',
        entityId: id,
        afterValues: { status, correctedName, notes },
        result: 'SUCCESS'
      });
    }

    res.json({
      message: 'Status verifikasi taksonomi berhasil diperbarui',
      species: updated
    });
  } catch (err: any) {
    console.error('Error in PATCH /api/whmp/species/:id/taxonomy:', err);
    res.status(500).json({ error: 'Gagal memperbarui status taksonomi' });
  }
});

/**
 * GET /api/whmp/proposed-species
 * List proposed species (outside the 60)
 */
whmpRouter.get('/whmp/proposed-species', (_req: Request, res: Response) => {
  try {
    const list = whmpRiskStore.getProposedSpecies();
    res.json({
      total: list.length,
      proposedSpecies: list
    });
  } catch (err: any) {
    console.error('Error in GET /api/whmp/proposed-species:', err);
    res.status(500).json({ error: 'Gagal memuat daftar usulan spesies baru' });
  }
});

/**
 * POST /api/whmp/proposed-species
 * Submit a proposed species outside the 60 (including non-birds)
 */
whmpRouter.post('/whmp/proposed-species', (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const {
      common_name_id,
      common_name_en,
      proposed_latin_name,
      group,
      proposed_severity,
      severity_justification,
      estimated_likelihood,
      first_observed_date,
      first_observed_zone_id,
      first_observed_location_desc,
      estimated_population,
      photo_url
    } = req.body || {};

    if (!common_name_id || !proposed_latin_name || !group || !proposed_severity || !estimated_likelihood) {
      return res.status(400).json({
        error: 'Nama Indonesia, nama latin usulan, kelompok satwa, tingkat keparahan (1..5), dan perkiraan frekuensi (A..E) wajib diisi.'
      });
    }

    const proposedByName = user ? `${user.fullName} (${user.role})` : 'Petugas Airside WHU';
    const proposedByUserId = user ? user.id : 'usr-officer-guest';

    const newEntry = whmpRiskStore.addProposedSpecies({
      common_name_id: common_name_id.trim(),
      common_name_en: (common_name_en || common_name_id).trim(),
      proposed_latin_name: proposed_latin_name.trim(),
      group,
      proposed_severity: Number(proposed_severity) as any,
      severity_justification: severity_justification || 'Satwa baru teramati di kawasan airside CGK.',
      estimated_likelihood,
      first_observed_date: first_observed_date || new Date().toISOString().slice(0, 10),
      first_observed_zone_id: first_observed_zone_id || 'zone-1',
      first_observed_location_desc,
      estimated_population: Number(estimated_population) || 1,
      photo_url,
      proposed_by_name: proposedByName,
      proposed_by_user_id: proposedByUserId
    });

    if (user) {
      securityDb.appendAuditLog({
        actorUserId: user.id,
        actorEmail: user.email,
        actorIp: req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1',
        userAgent: (req.headers['user-agent'] as string) || 'WHMS-Client',
        action: 'WHMP_PROPOSED_SPECIES_SUBMITTED',
        entityType: 'ProposedSpecies',
        entityId: newEntry.id,
        afterValues: { common_name_id, proposed_latin_name, group },
        result: 'SUCCESS'
      });
    }

    res.status(201).json({
      message: 'Usulan spesies baru berhasil didaftarkan dan menunggu peninjauan supervisor.',
      proposedSpecies: newEntry
    });
  } catch (err: any) {
    console.error('Error in POST /api/whmp/proposed-species:', err);
    res.status(500).json({ error: 'Gagal mendaftarkan usulan spesies baru' });
  }
});

/**
 * PATCH /api/whmp/proposed-species/:id/review
 * Review (APPROVE, REJECT, UNDER_REVIEW) proposed species
 */
whmpRouter.patch('/whmp/proposed-species/:id/review', (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { action, review_notes } = req.body || {};

    if (!['APPROVE', 'REJECT', 'UNDER_REVIEW'].includes(action)) {
      return res.status(400).json({ error: 'Tindakan harus APPROVE, REJECT, atau UNDER_REVIEW' });
    }

    const reviewerName = user ? `${user.fullName} (${user.role})` : 'Supervisor WHMS Reviewer';
    const reviewerUserId = user ? user.id : 'usr-reviewer-guest';

    const result = whmpRiskStore.reviewProposedSpecies(
      id,
      action,
      reviewerName,
      reviewerUserId,
      review_notes
    );

    if (!result) {
      return res.status(404).json({ error: 'Usulan spesies tidak ditemukan' });
    }

    if (user) {
      securityDb.appendAuditLog({
        actorUserId: user.id,
        actorEmail: user.email,
        actorIp: req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1',
        userAgent: (req.headers['user-agent'] as string) || 'WHMS-Client',
        action: `WHMP_PROPOSED_SPECIES_${action}`,
        entityType: 'ProposedSpecies',
        entityId: id,
        afterValues: { action, review_notes, addedToCatalog: result.addedToCatalog ? result.addedToCatalog.id : '' },
        result: 'SUCCESS'
      });
    }

    res.json({
      message: action === 'APPROVE' 
        ? 'Spesies baru disetujui dan telah dimasukkan ke dalam katalog aktif WHMP!' 
        : `Status usulan berhasil diperbarui menjadi ${action}.`,
      proposed: result.proposed,
      addedToCatalog: result.addedToCatalog
    });
  } catch (err: any) {
    console.error('Error in PATCH /api/whmp/proposed-species/:id/review:', err);
    res.status(500).json({ error: 'Gagal memperbarui ulasan spesies' });
  }
});
